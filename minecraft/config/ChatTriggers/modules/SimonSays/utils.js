export const getObjectXYZ = (object, ints=false) => {
    const pos = [object.getX(), object.getY(), object.getZ()]
    if (!ints) return pos
    return pos.map(a => Math.floor(a))
}

export const MouseEvent = Java.type("net.minecraftforge.client.event.MouseEvent")

export default class RenderLib {
    static drawInnerEspBox = (x, y, z, w, h, red, green, blue, alpha, phase) => {
        Tessellator.pushMatrix();
        GL11.glLineWidth(2.0);
        GlStateManager.func_179129_p(); // disableCullFace
        GlStateManager.func_179147_l(); // enableBlend
        GlStateManager.func_179112_b(770, 771); // blendFunc
        GlStateManager.func_179132_a(false); // depthMask
        GlStateManager.func_179090_x(); // disableTexture2D

        if (phase) {
            GlStateManager.func_179097_i() // disableDepth
        }

        w /= 2;

        Tessellator.begin(GL11.GL_QUADS, false);
        Tessellator.colorize(red, green, blue, alpha);

        Tessellator.translate(x, y, z)
            .pos(w, 0, w)
            .pos(w, 0, -w)
            .pos(-w, 0, -w)
            .pos(-w, 0, w)

            .pos(w, h, w)
            .pos(w, h, -w)
            .pos(-w, h, -w)
            .pos(-w, h, w)

            .pos(-w, h, w)
            .pos(-w, h, -w)
            .pos(-w, 0, -w)
            .pos(-w, 0, w)

            .pos(w, h, w)
            .pos(w, h, -w)
            .pos(w, 0, -w)
            .pos(w, 0, w)

            .pos(w, h, -w)
            .pos(-w, h, -w)
            .pos(-w, 0, -w)
            .pos(w, 0, -w)

            .pos(-w, h, w)
            .pos(w, h, w)
            .pos(w, 0, w)
            .pos(-w, 0, w)
            .draw();

        GlStateManager.func_179089_o(); // enableCull
        GlStateManager.func_179084_k(); // disableBlend
        GlStateManager.func_179132_a(true); // depthMask
        GlStateManager.func_179098_w(); // enableTexture2D
        if (phase) {
            GlStateManager.func_179126_j(); // enableDepth
        }
                
        Tessellator.popMatrix();
    };
}