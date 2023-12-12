export default function FetchButton({ fetchApi }:{ fetchApi: () => void }) {
    return <button onClick={() => fetchApi()}>fetch</button>;
}
