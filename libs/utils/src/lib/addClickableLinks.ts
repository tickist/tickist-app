export function addClickableLinks(text: string): string {
    const exp =
        /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    const exp2 = /(^|[^/])(www\.[\S]+(\b|$))/gim;
    let richText;
    if (text) {
        richText = text
            .replace(exp, "<a target=\"_blank\" href='$1'>$1</a>")
            .replace(exp2, '$1<a target="_blank" href="http://$2">$2</a>');
    } else {
        richText = text;
    }
    return richText;
}
