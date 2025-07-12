import { Document } from "langchain/document";
import { File } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
const MessageSources = ({ sources }: { sources: Document[] }) => {
  const [showAllSources, setShowAllSources] = useState(false);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {sources
        .slice(0, showAllSources ? sources.length : 3)
        .map((source, i) => (
          <a
            className="bg-light-100 hover:bg-light-200 dark:bg-dark-100 dark:hover:bg-dark-200 transition duration-200 rounded-lg p-3 flex flex-col space-y-2 font-medium"
            key={i}
            href={source.metadata.url}
            target="_blank"
          >
            <p className="dark:text-white text-xs overflow-hidden whitespace-nowrap text-ellipsis">
              {source.metadata.title}
            </p>
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center space-x-1">
                {source.metadata.url === "File" ? (
                  <div className="bg-dark-200 hover:bg-dark-100 transition duration-200 flex items-center justify-center w-6 h-6 rounded-full">
                    <File size={12} className="text-white/70" />
                  </div>
                ) : (
                  <img
                    src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                    width={16}
                    height={16}
                    alt="favicon"
                    className="rounded-lg h-4 w-4"
                  />
                )}
                <p className="text-xs text-black/50 dark:text-white/50 overflow-hidden whitespace-nowrap text-ellipsis">
                  {source.metadata.url.replace(/.+\/\/|www.|\..+/g, "")}
                </p>
              </div>
              <div className="flex flex-row items-center space-x-1 text-black/50 dark:text-white/50 text-xs">
                <div className="bg-black/50 dark:bg-white/50 h-[4px] w-[4px] rounded-full" />
                <span>{i + 1}</span>
              </div>
            </div>
          </a>
        ))}
      {sources.length > 3 && (
        <button
          // onClick={openModal}
          className="bg-light-100 hover:bg-light-200 dark:bg-dark-100 dark:hover:bg-dark-200 transition duration-200 rounded-lg p-3 flex flex-col space-y-2 font-medium"
        >
          <div className="flex flex-row items-center space-x-1">
            {sources.slice(3, 6).map((source) => {
              return source.metadata.url === "File" ? (
                <div
                  key={source.metadata.url}
                  className="bg-dark-200 hover:bg-dark-100 transition duration-200 flex items-center justify-center w-6 h-6 rounded-full"
                >
                  <File size={12} className="text-white/70" />
                </div>
              ) : (
                <img
                  key={source.metadata.url}
                  src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                  width={16}
                  height={16}
                  alt="favicon"
                  className="rounded-lg h-4 w-4"
                />
              );
            })}
          </div>
          <Button
            onClick={() => {
              setShowAllSources((prev) => !prev);
            }}
            asChild
            variant="ghost"
            size="sm"
            className="text-xs font-medium"
          >
            <p className="text-xs text-black/50 dark:text-white/50">
              {!showAllSources
                ? `View ${sources.length - 3} more`
                : "Hide sources"}
            </p>
          </Button>
        </button>
      )}
      {/* <Transition appear show={isDialogOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeModal}>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                
                    <DialogTitle className="text-lg font-medium leading-6 dark:text-white">
                      Sources
                    </DialogTitle>
                    <div className="grid grid-cols-2 gap-2 overflow-auto max-h-[300px] mt-2 pr-2">
                      {sources.map((source, i) => (
                        <a
                          className="bg-light-secondary hover:bg-light-200 dark:bg-dark-secondary dark:hover:bg-dark-200 border border-light-200 dark:border-dark-200 transition duration-200 rounded-lg p-3 flex flex-col space-y-2 font-medium"
                          key={i}
                          href={source.metadata.url}
                          target="_blank"
                        >
                          <p className="dark:text-white text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                            {source.metadata.title}
                          </p>
                          <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-row items-center space-x-1">
                              {source.metadata.url === 'File' ? (
                                <div className="bg-dark-200 hover:bg-dark-100 transition duration-200 flex items-center justify-center w-6 h-6 rounded-full">
                                  <File size={12} className="text-white/70" />
                                </div>
                              ) : (
                                <img
                                  src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                                  width={16}
                                  height={16}
                                  alt="favicon"
                                  className="rounded-lg h-4 w-4"
                                />
                              )}
                              <p className="text-xs text-black/50 dark:text-white/50 overflow-hidden whitespace-nowrap text-ellipsis">
                                {source.metadata.url.replace(
                                  /.+\/\/|www.|\..+/g,
                                  '',
                                )}
                              </p>
                            </div>
                            <div className="flex flex-row items-center space-x-1 text-black/50 dark:text-white/50 text-xs">
                              <div className="bg-black/50 dark:bg-white/50 h-[4px] w-[4px] rounded-full" />
                              <span>{i + 1}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition> */}
    </div>
  );
};
export default MessageSources;
