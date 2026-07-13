export function FlickerDots() {
  return (
    <div className="flex items-center space-x-1">
      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .dot {
          animation: flicker 1.4s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
      `}</style>
      <span className="dot inline-block w-2 h-2 bg-white rounded-full"></span>
      <span className="dot inline-block w-2 h-2 bg-white rounded-full"></span>
      <span className="dot inline-block w-2 h-2 bg-white rounded-full"></span>
    </div>
  )
}