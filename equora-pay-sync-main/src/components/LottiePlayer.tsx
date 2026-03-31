import Lottie from "lottie-react";

type LottieVariant = "loading" | "success";

const loadingAnim = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "gold-loader",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "ring",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0] }, { t: 60, s: [360] }] },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [110, 110] }, nm: "ellipse" },
            {
              ty: "st",
              c: { a: 0, k: [0.831, 0.686, 0.216, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 10 },
              lc: 2,
              lj: 2,
              nm: "stroke",
            },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: "group",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

const successAnim = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 75,
  w: 200,
  h: 200,
  nm: "gold-success",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "check",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [0] }, { t: 10, s: [100] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [80, 80, 100] }, { t: 12, s: [100, 100, 100] }] },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-28, 4], [-8, 24], [30, -20]],
                  c: false,
                },
              },
              nm: "path",
            },
            {
              ty: "st",
              c: { a: 0, k: [0.831, 0.686, 0.216, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 12 },
              lc: 2,
              lj: 2,
              nm: "stroke",
            },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: "group",
        },
      ],
      ip: 0,
      op: 75,
      st: 0,
      bm: 0,
    },
  ],
};

export default function LottiePlayer({
  variant,
  className = "",
  loop,
}: {
  variant: LottieVariant;
  className?: string;
  loop?: boolean;
}) {
  const animationData = variant === "loading" ? loadingAnim : successAnim;
  const shouldLoop = loop ?? (variant === "loading");
  return <Lottie animationData={animationData} loop={shouldLoop} className={className} />;
}

