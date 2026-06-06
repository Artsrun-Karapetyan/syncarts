import { useRequest } from '../../contexts/RequestContext';

export function UrlBar() {
  const { url, setUrl } = useRequest();

  return (
    <input 
      className="input w-full font-mono bg-transparent border-transparent text-sm h-10 focus:border-transparent focus:shadow-none px-4" 
      placeholder="https://api.example.com/v1/users" 
      value={url}
      onChange={(e) => setUrl(e.target.value)}
    />
  );
}
