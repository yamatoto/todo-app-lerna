'use client'

import FetchButton from "@/components/FetchButton";


export default function Home() {
    const fetchApi = async ()=>{
        try {
           const res = await fetch('http://localhost:3001')
           console.log(await res.json())
        } catch (e) {
            console.error(e)

        }
    }

  return (
    <main>
      <div>hello next</div>
        <FetchButton
            fetchApi={fetchApi}/>
    </main>
  )
}
