const ICONS = [
  '/decor/clapperboard.png',
  '/decor/reel.png',
  '/decor/popcorn.png',
  '/decor/ticket.png',
  '/decor/glasses.png',
];

const GRID = [
  { top: '6%',  left: '6%'  }, { top: '4%',  left: '32%' }, { top: '9%',  left: '58%' }, { top: '5%',  left: '82%' },
  { top: '30%', left: '16%' }, { top: '28%', left: '46%' }, { top: '33%', left: '72%' }, { top: '27%', left: '92%' },
  { top: '55%', left: '4%'  }, { top: '58%', left: '30%' }, { top: '53%', left: '60%' }, { top: '57%', left: '86%' },
  { top: '82%', left: '20%' }, { top: '80%', left: '50%' }, { top: '84%', left: '78%' },
];

const DECOR_ITEMS = GRID.map((pos, i) => ({
  ...pos,
  src: ICONS[i % ICONS.length],
  size: 60 + ((i * 13) % 40), 
  rotate: ((i * 37) % 30) - 15, 
  duration: 8 + (i % 5),
  delay: (i % 7) * 0.4,
}));

export default function FloatingDecor() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {DECOR_ITEMS.map((item, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: item.top,
            left: item.left,
            width: item.size,
            animation: `floatDecor ${item.duration}s ease-in-out ${item.delay}s infinite alternate`,
          }}
        >
          <img
            src={item.src}
            alt=""
            className="w-full opacity-[0.045] select-none"
            style={{ transform: `rotate(${item.rotate}deg)` }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      ))}
    </div>
  );
}