"use client";

import FetchButton from "@/components/FetchButton";
import { useState } from "react";

export default function Home() {
    const [data, setData] = useState(null);

    const fetchApi = async () => {
        try {
            const res = await fetch("http://localhost:3001");
            const jsonData = await res.json();
            setData(jsonData);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <main>
            <div>hello next</div>
            <FetchButton fetchApi={fetchApi} />
            {data && <div>Data: {JSON.stringify(data)}</div>}
        </main>
    );
}
