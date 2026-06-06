import { useRequest } from '../../contexts/RequestContext';

export function MethodSelector() {
  const { method, setMethod } = useRequest();

  return (
    <select 
      className="input bg-bg-tertiary font-bold cursor-pointer w-28"
      value={method}
      onChange={(e) => setMethod(e.target.value)}
    >
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
      <option value="PATCH">PATCH</option>
    </select>
  );
}
