const colors = {
    bg: '#6366f1', // Indigo 500
    fg: '#ffffff'
};

function drawIcon(canvasId, size) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Draw Background (Rounded Rect)
    const radius = size * 0.2;
    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();

    // Draw Cloud Icon (Simplified)
    ctx.fillStyle = colors.fg;
    ctx.save();

    // Scale context to fit icon in 60% of box
    const scale = size / 24 * 0.6;
    ctx.translate(center, center);
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // Center the 24x24 icon path

    // Cloud Upload Path
    const path = new Path2D("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12");
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(path);

    ctx.restore();
}

window.onload = () => {
    drawIcon('c128', 128);
    drawIcon('c48', 48);
    drawIcon('c32', 32);
    drawIcon('c16', 16);
};

function downloadAll() {
    downloadCanvas('c128', 'icon128.png');
    setTimeout(() => downloadCanvas('c48', 'icon48.png'), 200);
    setTimeout(() => downloadCanvas('c32', 'icon32.png'), 400);
    setTimeout(() => downloadCanvas('c16', 'icon16.png'), 600);
}

function downloadCanvas(id, filename) {
    const canvas = document.getElementById(id);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
