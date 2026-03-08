import { useState, useEffect } from "react";

function FlashSaleCountdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatNumber = (num) => String(num).padStart(2, "0");

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "11px",
      fontWeight: "600",
      color: "#fff",
      backgroundColor: "#ee4d2d",
      padding: "3px 6px",
      borderRadius: "4px",
      fontFamily: "monospace",
    }}>
      <span>⚡</span>
      <span>{formatNumber(timeLeft.hours)}</span>
      <span style={{ fontSize: "10px", margin: "0 -2px" }}>:</span>
      <span>{formatNumber(timeLeft.minutes)}</span>
      <span style={{ fontSize: "10px", margin: "0 -2px" }}>:</span>
      <span>{formatNumber(timeLeft.seconds)}</span>
    </div>
  );
}

export default FlashSaleCountdown;
