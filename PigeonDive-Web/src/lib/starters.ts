// Email-safe starting points: table layout and inline CSS, since many mail clients ignore
// <style> blocks and modern layout CSS.

const wrap = (inner: string) => `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#eceeeb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eceeeb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;font-family:Arial,Helvetica,sans-serif;color:#111418;">
            <tr>
              <td style="padding:36px;">
${inner}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export type Starter = { id: string; name: string; blurb: string; format: "HTML" | "TEXT"; body: string };

export const STARTERS: Starter[] = [
  {
    id: "message",
    name: "Simple message",
    blurb: "A friendly note. Good for most things.",
    format: "HTML",
    body: wrap(`                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Hello,</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Write your message here.</p>
                <p style="margin:0;font-size:15px;line-height:1.6;">Thanks,<br />The team</p>`),
  },
  {
    id: "announcement",
    name: "Announcement",
    blurb: "A headline, a line of detail, one button.",
    format: "HTML",
    body: wrap(`                <p style="margin:0 0 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#848b87;">What's new</p>
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">A short, clear headline</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4f5753;">One or two sentences about what is new and why it matters to them.</p>
                <a href="https://example.com" style="display:inline-block;background:#111418;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 24px;border-radius:8px;">Take a look</a>`),
  },
  {
    id: "receipt",
    name: "Confirmation",
    blurb: "Confirm something happened, with a few details.",
    format: "HTML",
    body: wrap(`                <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25;">It's confirmed</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4f5753;">Here is a quick summary for your records.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5;border-top:1px solid #d9ddd8;">
                  <tr><td style="padding:12px 0;color:#848b87;border-bottom:1px solid #d9ddd8;">Reference</td><td align="right" style="padding:12px 0;border-bottom:1px solid #d9ddd8;">#12345</td></tr>
                  <tr><td style="padding:12px 0;color:#848b87;border-bottom:1px solid #d9ddd8;">Date</td><td align="right" style="padding:12px 0;border-bottom:1px solid #d9ddd8;">1 January</td></tr>
                </table>`),
  },
  {
    id: "plain",
    name: "Plain text note",
    blurb: "No design at all, just words.",
    format: "TEXT",
    body: "Hello,\n\nWrite your message here.\n\nThanks,\nThe team",
  },
];

export const SNIPPETS: { label: string; html: string }[] = [
  { label: "Heading", html: `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Your heading</h1>\n` },
  { label: "Paragraph", html: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Write something friendly here.</p>\n` },
  {
    label: "Button",
    html: `<a href="https://example.com" style="display:inline-block;background:#111418;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 24px;border-radius:8px;">Button text</a>\n`,
  },
  {
    label: "Image",
    html: `<img src="https://placehold.co/560x240" alt="" width="560" style="display:block;max-width:100%;height:auto;border-radius:8px;" />\n`,
  },
  { label: "Divider", html: `<hr style="border:none;border-top:1px solid #d9ddd8;margin:24px 0;" />\n` },
];
