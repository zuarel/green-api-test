import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow.tsx';
import { useCredentials } from '../routing/RequireAuth.tsx';
import { paths } from '../routing/paths.ts';

export default function ChatPage() {
  const credentials = useCredentials();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const [searchParams] = useSearchParams();

  if (!chatId?.trim()) return <Navigate to={paths.newChat} replace />;

  // The API chatId comes from the URL; the phone is only a display label.
  const phone = searchParams.get('phone') || chatId;

  return (
    <ChatWindow
      key={chatId} credentials={credentials} chat={{ chatId, phone }}
      onBack={() => navigate(paths.newChat)}
    />
  );
}
