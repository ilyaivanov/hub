import { colors, spacings } from "./consts";
import { ctx } from "./drawing";
import { Paragraph } from "./paragraph";

export function drawSelecitonBox(
    mode: string,
    screenWidth: number,
    p: Paragraph
) {
    const ms = ctx.measureText("foo");
    const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

    ctx.globalAlpha = 0.2;
    ctx.fillStyle =
        mode == "Normal" ? colors.selectedRect : colors.selectedRectInsert;

    //TODO: paragraphExtraLineHeight is used improperly here, to be corrected
    const selectedBoxY =
        p.y - h / 2 - (h * spacings.paragraphExtraLineHeight) / 2;

    const selectedBoxHeight =
        p.lines.length * h * spacings.lineHeight +
        h * spacings.paragraphExtraLineHeight;

    ctx.fillRect(0, selectedBoxY, screenWidth, selectedBoxHeight);

    ctx.globalAlpha = 1;
}
