<script>
/* We want to distribute N elements, each with aspect ratio (width:height) =
   (1:alpha), into a grid.
   We want to scale the elements as large as we can, while staying within the
   (w,h) bounds.*/


function maxScale(N, h, w, alpha, n) {
  k = Math.ceil(N / n);
  // We require      n * s <= w, and k * s * alpha <= h
  // In other words, s <= w/n    and s <= h/k/alpha
  return min(w/n, h/k/alpha);
}

function optRowSize(N, h, w, alpha) {
  bestS = 0;
  bestN = undefined;
  for (var n = 1; n <= N; n++) {
    s = maxScale(N, h, w, alpha, n);
    bestN = s > bestScale ? n : bestN;
    bestS = s > bestScale ? s : bestS;
  }

  return bestN;
}

export default {
  render(h): {
    const N = h.$slots.length;
    /** Find row length n that gives maximum scale */
 
    function s(N, h, w
  }
}

