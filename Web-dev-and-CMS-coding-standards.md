# Web dev and CMS coding standards

## General

Simpler is always better. Don't write more HTML than you need to accomplish a task or meet a requirement.

Use semantic tags to represent page elements:

- hX (h1, h2, h3) tags to represent headings
- p tags for paragraphs
- section and articles
- nav, header and footer for corresponding sections

Use lower case for all tags

Use proper indenting

Use a single tab for each logical level of page structure

Use the minimum amount of markup necessary to achieve the required layout and UX

## Anchor tags

Use anchor tags for navigation and links (changing location or URL).

Use button elements for actions (submit, open modal, toggle UI, etc).

Do not add `title` or `aria-label` when the element already has clear visible text. Only add accessible labels when the visible text is missing or ambiguous.

## Buttons and forms

Use Semantic HTML elements:

- Use &lt;button&gt;, &lt;input&gt;, &lt;label&gt;, &lt;select&gt;, and &lt;textarea&gt; appropriately
- Avoid using &lt;div&gt; or &lt;span&gt; for interactive elements unless absolutely necessary, and if used, ensure they have appropriate ARIA roles and properties

Provide Descriptive Labels:

- Use the &lt;label&gt; element to associate text labels with form controls using the 'for' attribute
- Ensure every form control has an associated label

Keyboard Accessibility:

- Ensure all interactive elements (buttons, inputs, etc) are reachable and operable using the keyboard alone
- Use the tabindex attribute to manage the tab order, but avoid positive values (tabindex="1") as much as possible

Buttons (&lt;button&gt;):

- Use &lt;button&gt; for clickable actions. Button has browser-built-in keyboard accessibility and proper semantics
- Ensure buttons have descriptive text or accessible labels using aria-label

Inputs (&lt;input&gt;, &lt;select&gt;, &lt;textarea&gt;):

- Ensure each input element has a corresponding &lt;label&gt;
- For complex form elements (like radio buttons and checkboxes), use &lt;fieldset&gt; and &lt;legend&gt; to group them

Select Menus (&lt;select&gt;):

- Use &lt;select&gt; for dropdown menus and provide meaningful option text

## ARIA Roles and Properties

ARIA Labels and Descriptions:

- Use aria-label to provide accessible names for elements that do not have visible text labels
- Use aria-describedby to link an element to another element with additional descriptive text

ARIA Roles:

- Use ARIA roles correctly to ensure elements are recognized by assistive technologies

## Accessibility and Responsiveness

Color Contrast and Visual Cues:

- Ensure sufficient color contrast between text and background.
- Provide additional visual cues (like borders or icons) for critical actions or states.

Responsive Design:

- Ensure that form elements and buttons are usable on all screen sizes and mobile/touch devices

## Image tags

Use alt Attribute for descriptive text on &lt;img&gt; tags:

- Always include an alt attribute for img elements to provide text descriptions
- The alt text should be concise and describe the content and function of the image
- If the image is purely decorative, use an empty alt attribute (alt="")

If the image conveys information that is not captured by the alt attribute, provide additional context using nearby text or ARIA attributes

Set explicit image height and width in html and/or CSS

Ensure that images scale correctly within their containers, using max-width and auto height

For large images, use Lazy Loading to improve performance:

- Use the loading="lazy" attribute to defer loading of large offscreen images until the user scrolls the element into view

## H1 tags

Each page must contain one AND only one H1 tag

H1 value should be descriptive of the page theme and purpose

## CSS

Use standard Bootstrap classes as much as possible. Write custom classes only as needed. If there's a Bootstrap class you can use to achieve a design, use it.

Use minimum number of classes and declarations to achieve required design. Use IDs only when you know there will ever be a single occurrence of the ID in any given page.

Ensure that each unique section is defined by a unique parent class. Don't try to reuse classes for purposes they weren't designed for.

Responsive CSS

- Use Bootstrap breakpoints
- Avoid overlapping media queries
