import { useRequest } from '../../contexts/RequestContext';

export function UrlBar() {
  const { url, setUrl } = useRequest();

  return (
    <input 
      className="input w-full font-mono" 
      placeholder="https://api.example.com/v1/users" 
      value={url}
      onChange={(e) => setUrl(e.target.value)}
    />
  );
}
