import { AnimatePresence, motion, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

// Global unified tick to sync all "auto" animations
let globalTick = 0;
const tickListeners = new Set();
let globalIntervalId = null;

function ensureGlobalInterval(intervalMs) {
    if (!globalIntervalId && intervalMs > 0) {
        globalIntervalId = setInterval(() => {
            globalTick++;
            tickListeners.forEach(l => l(globalTick));
        }, intervalMs);
    }
}

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

    // Handle auto trigger
    useEffect(() => {
        if (trigger === "auto") {
            setActive(true);
            setAnimating(true);

            if (repeatInterval > 0) {
                ensureGlobalInterval(repeatInterval);
                const listener = (newTick) => {
                    setAnimating(true);
                    setCount(newTick);
                };
                tickListeners.add(listener);
                // Initialize to global tick so late-mounters are synced
                setCount(globalTick);
                return () => tickListeners.delete(listener);
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
        overflow: "visible", // Fix potential clipping
        padding: "0 1px",
    };

    const flexCenter = {
        display: "flex",
        flexWrap: "nowrap", // DO NOT WRAP CHARACTERS
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
                flexWrap: "nowrap", // PREVENT WRAPPING
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap", // Enforce no line breaking
                cursor: trigger === "click" || trigger === "hover" ? "pointer" : "default",
            }}
            className={className}
            {...props}
        >
            <AnimatePresence mode="popLayout">
                {animating ? (
                    <motion.span
                        key={count}
                        style={flexCenter}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        {characters.map((char, i) => (
                            <span key={i} style={charWrapStyle}>
                                {/* Main Character */}
                                <motion.span
                                    initial={{ opacity: 0, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, filter: "blur(0px)" }}
                                    transition={{ delay: i * 0.04 + 0.3, duration: 0.4 }}
                                    style={baseCharStyle}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>

                                {/* Top Slice Layer */}
                                <motion.span
                                    initial={{ x: "-100%", opacity: 0 }}
                                    animate={{ x: "100%", opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 0.6,
                                        delay: i * 0.04,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        ...sliceCharStyle,
                                        clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
                                    }}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>

                                {/* Middle Slice Layer */}
                                <motion.span
                                    initial={{ x: "100%", opacity: 0 }}
                                    animate={{ x: "-100%", opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 0.6,
                                        delay: i * 0.04 + 0.1,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        ...sliceCharStyle,
                                        color: "rgba(255,255,255,0.8)",
                                        clipPath: "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
                                    }}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>

                                {/* Bottom Slice Layer */}
                                <motion.span
                                    initial={{ x: "-100%", opacity: 0 }}
                                    animate={{ x: "100%", opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 0.6,
                                        delay: i * 0.04 + 0.2,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        ...sliceCharStyle,
                                        clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
                                    }}
                                >
                                    {char === " " ? "\u00A0" : char}
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
