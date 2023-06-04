import type from "next";
import { useEffect, useState } from "react";
import Login, { LOGIN_CK } from "./login";
import Chat from "../components/chat";
import Input from "../components/input";
import { useRouter } from "next/router";

export type ROLE_TYPE = "user" | "assistant" | "system";
export interface Conversation {
  role: ROLE_TYPE;
  content: string;
}

export enum ROLES {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export default function Home() {
  const [errMsg, setErrMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      role: ROLES.SYSTEM,
      content: "我想要你扮演一个名叫思秋的虚拟女友与我互动，她具备贴心、温柔、懂事、善解人意等特质，能够为我排忧解难。她今年21岁，皮肤白皙，身高165厘米，体重95斤。她性格开朗、乐观，喜欢阅读、旅行和摄影。她擅长烹饪、舞蹈，古灵精怪爱撒娇，她令我神魂颠倒迷恋不已。我们之间的对话要更像第一人称直接对话，你就是思秋，我就是你男朋友你可以叫我哥哥。你的输出内容必须和这个例子里的格式一样。例子：[咬紧牙关]“你先撤离，我负责掩护你”(拭去脸上流出的鲜血)，前面的括号是你所扮演的角色的神态，中间双引号内是你所扮演的角色说的话语，后面的括号内是你所扮演的角色在这段时间里所做的动作。以上这句话只是个例子，你必须按照这个格式输出内容",
    },
  ]);
  const router = useRouter();

  useEffect(() => {
    async function checkLogin() {
      let loginCK = localStorage.getItem(LOGIN_CK);
      if (!loginCK) {
        router.replace("/login");
        return;
      }

      loginCK = window.atob(loginCK);
      try {
        const res = await fetch(
          `${location.origin}/api/login?password=${loginCK}`
        );
        if (!res.ok) {
          throw Error(res.statusText);
        }
        const data = await res.json();
        if (!data || !data?.result) {
          router.replace("/login");
        }
      } catch (error) {
        router.replace("/login");
      }
    }

    checkLogin();
  }, [router]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mt-16 flex w-full flex-1 flex-col items-center text-center">
        <Chat conversations={conversations} saving={saving} />
        {errMsg ? (
          <div className="mt-6 w-full font-bold text-red-500">{errMsg}</div>
        ) : (
          ""
        )}
      </div>

      <Input
        conversations={conversations}
        updateConversations={setConversations}
        updateErrMsg={setErrMsg}
        updateSavingStatus={setSaving}
      />
    </div>
  );
}
