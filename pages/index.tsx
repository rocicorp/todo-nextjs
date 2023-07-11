import { useReplicache } from "../src/frontend";

import App from "../src/app";
import { mutators } from "../src/mutators";

export default function Home() {
  const rep = useReplicache({ mutators });
  if (!rep) {
    return null;
  }

  return (
    <div className="todoapp">
      <App rep={rep} />
    </div>
  );
}
