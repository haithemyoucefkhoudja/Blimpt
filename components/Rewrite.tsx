import { ArrowLeftRight } from "lucide-react";

const Rewrite = ({
  rewrite,
  disabled,
}: {
  rewrite: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        rewrite();
      }}
      disabled={disabled}
      className="py-2 px-3 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white flex flex-row items-center space-x-1"
    >
      <ArrowLeftRight size={18} />
      <p className="text-xs font-medium">Rewrite</p>
    </button>
  );
};

export default Rewrite;
