export function MethodSelector() {
  return (
    <select className="input bg-bg-tertiary font-bold cursor-pointer w-28">
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
      <option value="PATCH">PATCH</option>
    </select>
  );
}
