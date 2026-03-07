import { AnimatePresence, motion, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export function ShutterText({
    text = "IMMERSE",
    trigger = "auto",
    className = "",
    sliceColor = "#ffaa55",
    textColor = "#ffffff",
    repeatInterval = 5000,
    ...props
}) {
    const [count, setCount] = useState(0);
    const [active, setActive] = useState(
        trigger === "auto" || trigger === "click" || trigger === "hover"
    );
    const [animating, setAnimating] = useState(trigger === "auto");
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.5 });
    const characters = text.split("");

    // Handle scroll trigger
    useEffect(() => {
        if (trigger === "scroll" && isInView) {
            setActive(true);
            setAnimating(true);
            setCount((c) => c + 1);
        }
        if (trigger === "scroll" && !isInView) {
            setActive(false);
            setAnimating(false);
        }
    }, [trigger, isInView]);

    // Handle auto trigger – animate on mount and repeat every repeatInterval ms
    useEffect(() => {
        if (trigger === "auto") {
            setActive(true);
            setAnimating(true);
            setCount((c) => c + 1);

            if (repeatInterval > 0) {
                const interval = setInterval(() => {
                    setAnimating(true);
                    setCount((c) => c + 1);
                }, repeatInterval);
                return () => clearInterval(interval);
            }
        }
    }, [trigger, repeatInterval]);

    const handleClick = useCallback(() => {
        if (trigger === "click") {
            setAnimating(true);
            setCount((c) => c + 1);
        }
    }, [trigger]);

    const handleMouseEnter = useCallback(() => {
        if (trigger === "hover") {
            setAnimating(true);
            setCount((c) => c + 1);
        }
    }, [trigger]);

    const handleMouseLeave = useCallback(() => {
        if (trigger === "hover") {
            setAnimating(false);
        }
    }, [trigger]);

    const baseCharStyle = {
        display: "inline-block",
        fontWeight: 800,
        color: textColor,
        lineHeight: 1,
        letterSpacing: "-0.02em",
    };

    const sliceCharStyle = {
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "inline-block",
        fontWeight: 800,
        color: sliceColor,
        lineHeight: 1,
    };

    const charWrapStyle = {
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        padding: "0 0.5px",
    };

    const flexCenter = {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
    };

    return (
        <div
            ref={ref}
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                position: "relative",
                display: "inline-flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                cursor: trigger === "click" || trigger === "hover" ? "pointer" : "default",
            }}
            className={className}
            {...props}
        >
            <AnimatePresence mode="wait">
                {animating ? (
                    <motion.span key={count} style={flexCenter}>
                        {characters.map((char, i) => (
                            <span key={i} style={charWrapStyle}>
                                {/* Main Character */}
                                <motion.span
                                    initial={{ opacity: 0, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, filter: "blur(0px)" }}
                                    transition={{ delay: i * 0.04 + 0.3, duration: 0.8 }}
                                    style={baseCharStyle}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>

                                {/* Top Slice Layer */}
                                <motion.span
                                    initial={{ x: "-100%", opacity: 0 }}
                                    animate={{ x: "100%", opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 0.7,
                                        delay: i * 0.04,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        ...sliceCharStyle,
                                        clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
                                    }}
                                >
                                    {char}
                                </motion.span>

                                {/* Middle Slice Layer */}
                                <motion.span
                                    initial={{ x: "100%", opacity: 0 }}
                                    animate={{ x: "-100%", opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 0.7,
                                        delay: i * 0.04 + 0.1,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        ...sliceCharStyle,
                                        color: "rgba(255,255,255,0.8)",
                                        clipPath: "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
                                    }}
                                >
                                    {char}
                                </motion.span>

                                {/* Bottom Slice Layer */}
                                <motion.span
                                    initial={{ x: "-100%", opacity: 0 }}
                                    animate={{ x: "100%", opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 0.7,
                                        delay: i * 0.04 + 0.2,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        ...sliceCharStyle,
                                        clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
                                    }}
                                >
                                    {char}
                                </motion.span>
                            </span>
                        ))}
                    </motion.span>
                ) : (
                    <span style={flexCenter}>
                        {characters.map((char, i) => (
                            <span key={i} style={charWrapStyle}>
                                <span style={baseCharStyle}>
                                    {char === " " ? "\u00A0" : char}
                                </span>
                            </span>
                        ))}
                    </span>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ShutterText;
