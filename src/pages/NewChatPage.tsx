import { useNavigate } from 'react-router-dom';
import ChatLauncher from '../components/ChatLauncher.tsx';
import { chatPath } from '../routing/paths.ts';
import { useCredentials } from '../routing/RequireAuth.tsx';

export default function NewChatPage() {
  const credentials = useCredentials();
  const navigate = useNavigate();

  return <ChatLauncher credentials={credentials} onOpen={(chat) => navigate(chatPath(chat))} />;
}
