import React, { useEffect, useState } from "react";

export default function Timer({ countdownFrom = 0 }) {
    const [countdown, setCountdown] = useState(countdownFrom);

    useEffect(() => {
        if (countdown <= 0) return;

        const interval = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);

        return () => {
            console.log("Removing interval", interval);
            clearTimeout(interval);
        };
    }, [countdown]);

    return <p>About {countdown} remaining...</p>;
}
