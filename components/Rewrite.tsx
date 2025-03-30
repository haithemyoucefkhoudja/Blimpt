import { ArrowLeftRight } from 'lucide-react';

const Rewrite = ({
  rewrite,
  messageId,
  type
}: {
  rewrite: (messageId: string, isList?:boolean) => void;
  messageId: string;
  type: 'list' | 'single';
}) => {
    return (
        <button
        onClick={() => rewrite(messageId, type === 'list')}
        className="py-2 px-3 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white flex flex-row items-center space-x-1"
    >
      <ArrowLeftRight size={18} />
      <p className="text-xs font-medium">Rewrite</p>
    </button>
  );
};

export default Rewrite;
