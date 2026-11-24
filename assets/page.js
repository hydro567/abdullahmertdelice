// Alt sayfalar: animasyonlu piksel kapak + klavyeyle geri donme
(function () {
  const cv = document.getElementById('art');
  const kind = document.body.dataset.art;
  const home = document.body.dataset.home || '../index.html?menu=1';
  if (cv && window.PixelArt) {
    const g = cv.getContext('2d');
    cv.width = PixelArt.VW; cv.height = PixelArt.VH;
    let t = 0, last = performance.now();
    (function loop(ms) {
      t += Math.min(.05, (ms - last) / 1000); last = ms;
      g.imageSmoothingEnabled = false;
      g.drawImage(PixelArt.renderArt(kind, t), 0, 0);
      requestAnimationFrame(loop);
    })(last);
  }
  addEventListener('keydown', e => {
    if (['Escape', 'Backspace', 'KeyL', 'KeyB'].includes(e.code)) { e.preventDefault(); location.href = home; }
  });
})();
