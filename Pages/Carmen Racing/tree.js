// Simple 8-bit tree for Carmen Racing
const treeImg = new Image();
treeImg.src = '../../assets/tree.png';
function drawTree(x, y) {
    if (treeImg.complete) {
        ctx.drawImage(treeImg, x, y, 24, 32);
    } else {
        treeImg.onload = () => ctx.drawImage(treeImg, x, y, 24, 32);
    }
}
