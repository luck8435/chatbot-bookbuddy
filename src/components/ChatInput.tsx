import { cn } from '@/lib/utils';
import { FC, HTMLAttributes, useContext, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useMutation } from 'react-query';
import { nanoid } from 'nanoid';
import { Message } from '@/lib/validators/message';
import { MessagesContext } from '@/context/messages';
import { Loader2, CornerDownLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatInputProps extends HTMLAttributes<HTMLDivElement> {}

const ChatInput: FC<ChatInputProps> = ({ className, ...props }) => {
    const [input, setInput] = useState<string>('');
    const { messages, addMessage, removeMessage, updateMessage, isMessageUpdating, setIsMessageUpdating } = useContext(MessagesContext);

    const textareaRef = useRef<null | HTMLTextAreaElement>(null);

    const { mutate: sendMessage, isLoading } = useMutation({
        mutationFn: async (message: Message) => {
            const response = await fetch('/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: [message] }),
            });

            return response.body;
        },
        onMutate(message) {
            addMessage(message);
        },
        onSuccess: async stream => {
            if (!stream) throw new Error('No stream found');
            const id = nanoid();
            const responseMessage: Message = {
                id,
                isUserMessage: false,
                text: '',
            };
            addMessage(responseMessage);
            setIsMessageUpdating(true);
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                updateMessage(id, prev => prev + chunkValue);
            }

            // clean up
            setIsMessageUpdating(false);
            setInput('');

            setTimeout(() => {
                textareaRef.current?.focus();
            }, 10);
        },
        onError(_, message) {
            toast.error('Something went wrong. Please try again.');
            removeMessage(message.id);
            textareaRef.current?.focus();
        },
    });

    return (
        <div {...props} className={cn('border-t border-zinc-300', className)}>
            <div className='relative mt-4 flex-1 overflow-hidden rounded-lg border-none outline-none'>
                <TextareaAutosize
                    ref={textareaRef}
                    disabled={isLoading}
                    rows={2}
                    maxRows={4}
                    autoFocus
                    placeholder='write a message...'
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const message = {
                                id: nanoid(),
                                isUserMessage: true,
                                text: input,
                            };
                            sendMessage(message);
                        }
                    }}
                    className='peer disabled:opacity-50 pr-14 resize-none block w-full border-0 bg-zinc-100 py-1.5 text-gray-900 focus:ring-0 sm:leading-6'
                />
                <div className='absolute inset-y-0 right-0 flex py-1.5 pr-1.5'>
                    <kbd className='inline-flex items-center rounded-border bg-white border-gray-200 px-1 font-sans '>
                        {isLoading ? <Loader2 className='w-3 h3 animate-spin' /> : <CornerDownLeft className='w-3 h-3' />}
                    </kbd>
                    <div aria-hidden='true' className='absolute inset-x-0 bottom-0 border-t border-gray-300 peer-focus:border-t-2 peer'></div>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
