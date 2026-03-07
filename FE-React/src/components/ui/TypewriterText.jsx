import { motion } from "motion/react";
import { useState, useEffect, forwardRef } from "react";

const TypewriterText = forwardRef(
    (
        {
            words,
            className = "",
            typingSpeed = 100,
            deletingSpeed = 50,
            pauseDuration = 1500,
            cursorClassName = "",
        },
        ref
    ) => {
        const [currentWordIndex, setCurrentWordIndex] = useState(0);
        const [currentText, setCurrentText] = useState("");
        const [isDeleting, setIsDeleting] = useState(false);

        useEffect(() => {
            const currentWord = words[currentWordIndex] || "";
            const timeout = setTimeout(
                () => {
                    if (!isDeleting) {
                        if (currentText.length < currentWord.length) {
                            setCurrentText(currentWord.slice(0, currentText.length + 1));
                        } else {
                            setTimeout(() => setIsDeleting(true), pauseDuration);
                        }
                    } else {
                        if (currentText.length > 0) {
                            setCurrentText(currentText.slice(0, -1));
                        } else {
                            setIsDeleting(false);
                            setCurrentWordIndex((prev) => (prev + 1) % words.length);
                        }
                    }
                },
                isDeleting ? deletingSpeed : typingSpeed
            );
            return () => clearTimeout(timeout);
        }, [
            currentText,
            isDeleting,
            currentWordIndex,
            words,
            typingSpeed,
            deletingSpeed,
            pauseDuration,
        ]);

        return (
            <span ref={ref} className={className} style={{ display: "inline-block" }}>
                {currentText}
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    style={{
                        marginLeft: "2px",
                        display: "inline-block",
                        height: "1em",
                        width: "2px",
                        backgroundColor: "currentColor",
                        verticalAlign: "middle",
                    }}
                    className={cursorClassName}
                />
            </span>
        );
    }
);

TypewriterText.displayName = "TypewriterText";

export { TypewriterText };
