import React from "react";

const StreamVideo = () => {
    const streamUrl = import.meta.env.VITE_IP_CAMERA_URL

    return (
        <div className="overflow-hidden w-fit">
            <img
                src={streamUrl}
                alt="Live Stream"
                className="w-[500px] object-cover"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                    alert("Cannot load video stream. Check IP or network.");
                }}
            />
        </div>
    );
};

export default StreamVideo;
