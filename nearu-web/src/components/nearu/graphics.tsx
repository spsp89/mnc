import type { CSSProperties } from "react";

export function HeroGraphic() {
  return (
    <div className="relative h-[230px] w-full max-w-[430px]">
      <div className="absolute inset-x-6 bottom-3 h-14 rounded-full bg-gradient-to-r from-[#2152ac] to-[#2a64c6] shadow-[0_18px_30px_rgba(4,17,62,0.42)]" />
      <div className="absolute left-[38%] top-8 h-28 w-28 rounded-full border-[18px] border-[#ffbf2f] bg-transparent" />
      <div className="absolute left-[47%] top-28 h-24 w-6 rounded-full bg-[#f0a800]" />
      <div className="absolute right-20 bottom-10 h-28 w-24 rounded-[18px] bg-[#ffbe2e] shadow-[0_18px_30px_rgba(39,22,0,0.32)]" />
      <div className="absolute right-[92px] top-[34px] h-10 w-12 rounded-full border-[4px] border-[#19458c]" />
      <div className="absolute bottom-8 right-[170px] h-9 w-9 rounded-lg bg-[#c58b35]" />
      <div className="absolute bottom-14 right-[148px] h-7 w-7 rounded-md bg-[#d49e46]" />
      <div className="absolute bottom-8 right-4 h-12 w-9 rounded-xl bg-[#6cb53a]" />
      <div className="absolute bottom-10 right-[154px] h-6 w-6 rounded-md bg-[#d49e46]" />
      <div className="absolute bottom-10 right-8 h-4 w-4 rounded-full bg-[#4d8f2b]" />
    </div>
  );
}

export function DealGraphic() {
  return (
    <div className="relative h-28 w-60">
      <div className="absolute left-12 top-7 h-20 w-24 rounded-2xl bg-[#ffbe2e]" />
      <div className="absolute left-[87px] top-7 h-20 w-4 bg-[#f25b28]" />
      <div className="absolute left-12 top-14 h-3 w-24 bg-[#f25b28]" />
      <div className="absolute left-[64px] top-1 h-8 w-8 rounded-full border-[7px] border-[#f25b28]" />
      <div className="absolute left-[102px] top-1 h-8 w-8 rounded-full border-[7px] border-[#f25b28]" />
      <div className="absolute right-5 top-5 h-20 w-16 rounded-2xl bg-[#153f8e]" />
      <div className="absolute right-8 top-0 h-8 w-10 rounded-full border-[4px] border-[#153f8e]" />
      <div className="absolute left-0 top-12 rounded-2xl bg-[#17376c] px-3 py-2 text-sm font-bold text-white">
        % OFF
      </div>
      <div className="absolute left-6 top-0 h-3 w-3 rotate-45 bg-[#ffb61d]" />
      <div className="absolute left-40 top-0 h-3 w-3 rotate-45 bg-[#ff7348]" />
      <div className="absolute left-44 top-14 h-2.5 w-2.5 rotate-45 bg-[#ffb61d]" />
      <div className="absolute right-2 top-12 h-2.5 w-2.5 rotate-45 bg-[#ff7348]" />
    </div>
  );
}

export function MapMock() {
  const pins: CSSProperties[] = [
    { left: "58%", top: "18%" },
    { left: "80%", top: "24%" },
    { left: "68%", top: "42%" },
    { left: "50%", top: "52%" },
    { left: "40%", top: "77%" },
    { left: "74%", top: "79%" },
    { left: "22%", top: "36%" },
    { left: "56%", top: "44%" },
  ];

  return (
    <div className="relative h-[290px] overflow-hidden rounded-[22px] bg-[#f2f6fb]">
      <div className="absolute inset-y-0 left-0 w-[26%] bg-[#bde1ff]" />
      <div className="absolute inset-0 opacity-90">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`h-${index}`}
            className="absolute h-px rounded-full bg-[#d8dee9]"
            style={{
              left: `${10 + index * 4}%`,
              right: `${index % 2 === 0 ? 4 : 10}%`,
              top: `${index * 12 + 8}%`,
              transform: `rotate(${index % 2 === 0 ? 8 : -7}deg)`,
            }}
          />
        ))}
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={`v-${index}`}
            className="absolute w-px rounded-full bg-[#d8dee9]"
            style={{
              top: `${index % 2 === 0 ? 0 : 6}%`,
              bottom: `${index % 3 === 0 ? 8 : 0}%`,
              left: `${index * 11 + 28}%`,
              transform: `rotate(${index % 2 === 0 ? 4 : -5}deg)`,
            }}
          />
        ))}
      </div>
      {pins.map((style, index) => (
        <div
          key={index}
          className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white ${
            index === pins.length - 1 ? "bg-[#ffbe2e]" : "bg-[#0d2a63]"
          }`}
          style={style}
        />
      ))}
    </div>
  );
}

export function BusinessGraphic({ variant }: { variant: string }) {
  const base =
    "relative h-full w-full overflow-hidden rounded-[18px] bg-gradient-to-br";

  switch (variant) {
    case "plate":
      return (
        <div className={`${base} from-[#24160d] to-[#5b4638]`}>
          <div className="absolute left-1/2 top-1/2 h-20 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dce5e6] shadow-[0_16px_28px_rgba(0,0,0,0.3)]" />
          <div className="absolute left-[32%] top-[42%] h-7 w-7 rounded-full bg-[#d18c47]" />
          <div className="absolute left-[45%] top-[35%] h-8 w-8 rounded-full bg-[#dba253]" />
          <div className="absolute left-[56%] top-[44%] h-7 w-7 rounded-full bg-[#bb773f]" />
          <div className="absolute left-[42%] top-[55%] h-5 w-14 rounded-full bg-[#7caf4d]" />
        </div>
      );
    case "suit":
      return (
        <div className={`${base} from-[#170f0a] to-[#58442f]`}>
          <div className="absolute left-1/2 top-7 h-12 w-12 -translate-x-1/2 rounded-full bg-[#d5b189]" />
          <div className="absolute left-1/2 top-14 h-24 w-28 -translate-x-1/2 rounded-[22px] bg-[#0c1b37]" />
          <div className="absolute left-1/2 top-[74px] h-20 w-5 -translate-x-1/2 bg-white" />
        </div>
      );
    case "basket":
      return (
        <div className={`${base} from-[#4d3119] to-[#7a5730]`}>
          <div className="absolute left-1/2 top-1/2 h-16 w-32 -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-[#b77b38]" />
          {[
            ["22%", "#ed5b49"],
            ["38%", "#ffba2f"],
            ["54%", "#7cc24a"],
            ["69%", "#ecdc4e"],
            ["48%", "#dc8e48"],
          ].map(([left, color], index) => (
            <div
              key={index}
              className="absolute top-[34%] h-7 w-7 rounded-full"
              style={{ left, backgroundColor: color }}
            />
          ))}
        </div>
      );
    case "salon":
      return (
        <div className={`${base} from-[#433126] to-[#6f5843]`}>
          <div className="absolute inset-x-8 bottom-5 h-16 rounded-xl bg-[#241c17]" />
          <div className="absolute left-1/2 top-7 h-20 w-14 -translate-x-1/2 rounded-[16px] bg-[#f0cca0]" />
        </div>
      );
    case "shelf":
      return (
        <div className={`${base} from-[#dcb16f] to-[#b87c2e]`}>
          {Array.from({ length: 4 }).map((_, row) => (
            <div
              key={row}
              className="absolute left-0 right-0 h-2 bg-[#7a4a18]"
              style={{ top: `${18 + row * 22}%` }}
            />
          ))}
          {Array.from({ length: 4 }).map((_, column) =>
            Array.from({ length: 4 }).map((__, row) => (
              <div
                key={`${column}-${row}`}
                className="absolute h-3 w-3 rounded-sm"
                style={{
                  left: `${10 + column * 16}%`,
                  top: `${13 + row * 22}%`,
                  backgroundColor: ["#f15445", "#3f72e8", "#56b05e", "#ffbe2e"][column],
                }}
              />
            )),
          )}
        </div>
      );
    case "phone":
      return (
        <div className={`${base} from-[#071019] to-[#20457a]`}>
          <div className="absolute left-1/2 top-1/2 h-20 w-10 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-xl border border-white/70 bg-[#13243c]" />
        </div>
      );
    case "worker":
      return (
        <div className={`${base} from-[#447aa5] to-[#0a2d5d]`}>
          <div className="absolute left-1/2 top-5 h-10 w-10 -translate-x-1/2 rounded-full bg-[#d8b18b]" />
          <div className="absolute left-1/2 top-12 h-16 w-16 -translate-x-1/2 rounded-[18px] bg-[#123661]" />
        </div>
      );
    default:
      return (
        <div className={`${base} from-[#101a2f] to-[#244269]`}>
          <div className="absolute inset-6 rounded-3xl border border-white/10" />
        </div>
      );
  }
}
