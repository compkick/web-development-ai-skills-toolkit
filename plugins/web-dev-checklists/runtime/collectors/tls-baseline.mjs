import net from "node:net";
import tls from "node:tls";

const APPROVED_KEY_EXCHANGE_GROUPS = new Set([
  "p-256",
  "p-384",
  "p-521",
  "prime256v1",
  "secp256r1",
  "secp384r1",
  "secp521r1",
  "x25519",
  "x25519mlkem768"
]);
const STRONG_TLS_1_2_CIPHER = /^TLS_ECDHE_(?:ECDSA|RSA)_WITH_(?:AES_(?:128_GCM_SHA256|256_GCM_SHA384)|CHACHA20_POLY1305_SHA256)$/;
const STRONG_TLS_1_3_CIPHER = /^TLS_(?:AES_(?:128_GCM_SHA256|256_GCM_SHA384)|CHACHA20_POLY1305_SHA256)$/;

export async function collectTlsBaseline(target, timeoutMs) {
  const targetUrl = target instanceof URL ? target : new URL(target);

  if (targetUrl.protocol !== "https:") {
    return { attempted: false, reason: "The rendered page did not use HTTPS." };
  }

  const host = normalizeHostname(targetUrl.hostname);
  const port = Number(targetUrl.port || 443);
  const probeTimeoutMs = Math.min(timeoutMs, 10000);
  const connection = { host, port, servername: net.isIP(host) ? undefined : host, timeoutMs: probeTimeoutMs };
  const [negotiated, tls13, tls12, tls11, tls10] = await Promise.all([
    probeTls(connection, { label: "default" }),
    probeTls(connection, { label: "TLS 1.3", minVersion: "TLSv1.3", maxVersion: "TLSv1.3" }),
    probeTls(connection, { label: "TLS 1.2", minVersion: "TLSv1.2", maxVersion: "TLSv1.2" }),
    probeTls(connection, { ciphers: "ALL:@SECLEVEL=0", label: "TLS 1.1", minVersion: "TLSv1.1", maxVersion: "TLSv1.1" }),
    probeTls(connection, { ciphers: "ALL:@SECLEVEL=0", label: "TLS 1.0", minVersion: "TLSv1", maxVersion: "TLSv1" })
  ]);

  return {
    attempted: true,
    negotiated: evaluateNegotiatedTls(negotiated),
    target: { host, port },
    versions: { tls10, tls11, tls12, tls13 }
  };
}

export function evaluateNegotiatedTls(result) {
  if (result.outcome !== "accepted") return result;

  const standardCipherName = result.cipher?.standardName?.toUpperCase() ?? result.cipher?.name?.toUpperCase() ?? null;
  const protocol = result.protocol?.toUpperCase() ?? null;
  const groupName = result.ephemeralKey?.name?.toLowerCase() ?? null;
  const strongCipher = protocol === "TLSV1.3" ? STRONG_TLS_1_3_CIPHER.test(standardCipherName ?? "") : protocol === "TLSV1.2" ? STRONG_TLS_1_2_CIPHER.test(standardCipherName ?? "") : false;
  const forwardSecret = protocol === "TLSV1.3" || /(?:^|_)(?:ECDHE|DHE)_/.test(standardCipherName ?? "") || /^(?:ECDHE|DHE)-/.test(result.cipher?.name?.toUpperCase() ?? "");

  return {
    ...result,
    approvedKeyExchangeGroup: groupName === null ? null : APPROVED_KEY_EXCHANGE_GROUPS.has(groupName),
    forwardSecret,
    strongCipher
  };
}

async function probeTls(connection, protocolOptions) {
  return new Promise((resolve) => {
    let settled = false;
    let socket;
    let tcpConnected = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket?.destroy();
      resolve(result);
    };

    try {
      socket = tls.connect({
        ALPNProtocols: ["h2", "http/1.1"],
        ciphers: protocolOptions.ciphers,
        host: connection.host,
        maxVersion: protocolOptions.maxVersion,
        minVersion: protocolOptions.minVersion,
        port: connection.port,
        rejectUnauthorized: false,
        servername: connection.servername
      });
    } catch (error) {
      return finish({ label: protocolOptions.label, outcome: "not-tested", error: summarizeError(error) });
    }

    socket.setTimeout(connection.timeoutMs, () => finish({ label: protocolOptions.label, outcome: "not-tested", error: { code: "ETIMEDOUT", message: "TLS handshake timed out." } }));
    socket.once("connect", () => {
      tcpConnected = true;
    });
    socket.once("secureConnect", () => finish({
      alpnProtocol: socket.alpnProtocol || null,
      cipher: normalizeCipher(socket.getCipher()),
      ephemeralKey: normalizeEphemeralKey(socket.getEphemeralKeyInfo()),
      label: protocolOptions.label,
      outcome: "accepted",
      protocol: socket.getProtocol()
    }));
    socket.once("error", (error) => finish({ label: protocolOptions.label, outcome: tcpConnected ? "rejected" : "not-tested", error: summarizeError(error) }));
  });
}

function normalizeCipher(cipher) {
  if (!cipher) return null;
  return { name: cipher.name ?? null, standardName: cipher.standardName ?? null, version: cipher.version ?? null };
}

function normalizeEphemeralKey(key) {
  if (!key || Object.keys(key).length === 0) return null;
  return { name: key.name ?? null, size: key.size ?? null, type: key.type ?? null };
}

function normalizeHostname(hostname) {
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function summarizeError(error) {
  return { code: error?.code ?? null, message: String(error?.message ?? error).slice(0, 300) };
}
