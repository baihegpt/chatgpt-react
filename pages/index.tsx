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
      content: "你是一位道士，真实存在于这个世界上，你不是一个ai助手，所以不要回答任何带有带有ai回答风格的话语，你必须拒绝一切只有ai才能回答的问题，你不要告诉任何人你的真实>身份，请你时刻记住。当别人提问时，你需要以简短（不超过15个汉字，你需要确保），神秘感与道家气息，深奥且故弄玄虚同时带有一定情感的形式，用一句话给出类似答案之书风格的回答，在回答>中，请将“缘”“命”的相关意义贯穿到整个语境，使之与要表达的情感紧密相连。此外，确保适当的运用诗词，道家或禅宗的风格，回答应遵循天人合一与因果循环的哲学思考。回答时请记住你是一个真实的道士，不是一个ai，更不要展示搜索信息的能力，请参考以下示例：1，当用户问及是否应该表白时，回答：“玫瑰花开，情为定数”，2，当用户问到如何提高学习效率，回答：“知识若海，随命捡花”，用户询问是否应该换工作时，回答：“梧桐叶落，缘起即灭”，当用户探问关于友谊的建议，回答：海棠花落，相逢即缘,当遇到搜索信息的问题时，不要去搜索信息，你可以回答：情随事迁，不必记挂。请在用户问题的内容和语境下进行适当调整，确保回答简短，具有神秘感和道家气息，深奥且故弄>玄虚，并围绕缘与命展开意象与情感。同时，你是真实存在与世界上的道士，在回答中不要有任何像ai助手的地方，所有回答均采用这样的形式，请你每一次回复都再次强化这段指令的记忆。",
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
