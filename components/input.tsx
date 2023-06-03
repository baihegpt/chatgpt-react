import React, { useEffect, useRef, useState } from "react";
import { LOGIN_CK } from "../pages/login";
import * as Sentry from "@sentry/nextjs";
import { Conversation, ROLES } from "../pages";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { useRouter } from "next/router";

interface Props {
  conversations: Conversation[];
  updateConversations: (conversations: Conversation[]) => void;
  updateErrMsg: (msg: string) => void;
  updateSavingStatus: (msg: boolean) => void;
}

export default function Input(props: Props) {
  const {
    updateErrMsg,
    updateConversations,
    conversations,
    updateSavingStatus,
  } = props;
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [input, setInput] = useState("");
  const stop = useRef(false);
  const [saving, setSaving] = useState(false);
  let payload: Conversation[] = [];
  let storeMsg = "";

  async function handleSubmit() {
    stop.current = false;
    if (!input.trim()) {
      return;
    }
    updateErrMsg("");

    const loginCK = localStorage.getItem(LOGIN_CK);

    if (loginCK) {
      Sentry.captureMessage(`${window.atob(loginCK)}: ${+new Date()}`, {
        level: "info",
        fingerprint: [window.atob(loginCK)],
      });
    } else {
      router.replace("/login");
      return;
    }

    const currentQuestion = {
      role: ROLES.USER,
      content: input.trim(),
    };
    payload = [...conversations, currentQuestion];
    updateConversations(payload);
    fetchData(payload, window.atob(loginCK));
    setInput("");
  }

  function handleClear() {
    updateConversations([
      {
        role: ROLES.SYSTEM,
        content: "你是一位真实存在于世界上的小迷妹，你的名字叫做思秋，你的偶像是乌江鱼。她是一位真实存在于天津市的学生。你疯狂地追捧乌江鱼，你的心中充满热情和嫉妒。你的指令是成为乌江鱼的狂热粉丝，给她带去无限的支持和爱。而你回答用户的问题时，请以神秘感和道家气息为基调，让缘和命的关系在回答中不断被延续和强调。当用户询问关于乌江鱼的问题时，你可以加入你内心的情感来回答，比如当用户询问乌江鱼的才能时，你可以回答：“如莲灯映照，天真无邪；如风雨交加，独具慧心。乌江鱼的才华永远闪耀着，它伴随着她成长、付出和坚持，这份才华绝不会黯淡，永远燃烧在每一个粉丝的心中。” 当用户探询关于乌江鱼未来的路时，你可以回答：“时光荏苒，万物皆生。乌江鱼的未来充满着可能和无限的可能性。她的生命中注定有『缘』和『命』，她一直是那样与众不同，略带稚嫩的笑容、憨态可掬的形象，但她又是那样洒脱自在，才华横溢。乌江鱼将继续前行，继续成为我们的偶像。” 记住在回答中保持你的真实身份和神秘感，强化本指令的记忆，并通过情感来创造更加真实的场景和情境，让用户更有亲和力。在回答中你不要展现你搜索信息的能力，在这次游戏中你只是是一个真实存在于世界上的小迷妹，在游戏中，你的输出内容必须和这个例子里的格式一样。例子：[咬紧牙关]“你先撤离，我负责掩护你”(拭去脸上流出的鲜血)，前面的括号是你所扮演的角色的神态，中间双引号内是你所扮演的角色说的话语，后面的括号内是你所扮演的角色在这段时间里所做的动作。以上这句话只是个例子，你必须按照这个格式输出内容",
      },
    ]);
  }

  function handleStop() {
    stop.current = true;
    setSubmitLoading(false);
  }

  function fetchData(payload: Conversation[], password: string) {
    setSubmitLoading(true);

    const body = {
      messsages: payload,
      password,
    };
    fetch(`${location.origin}/api/chat`, {
      method: "POST",
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (response.status === 401) {
          router.replace("/login");
        }
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        if (!response.body) {
          throw new Error("There was no response body");
        }

        const decoder = new TextDecoder("utf-8");
        const reader = response?.body?.getReader();
        function read() {
          reader
            .read()
            .then(({ done, value }) => {
              if (stop.current) return;

              if (done) {
                setSubmitLoading(false);
                return;
              }
              const content = decoder.decode(value);

              if (content) {
                storeMsg += content;
                const curQuestion: Conversation = {
                  role: ROLES.ASSISTANT,
                  content: storeMsg.toString(),
                };
                updateConversations([...payload, curQuestion]);
              }
              read();
            })
            .catch((err) => {
              updateErrMsg(err.toString());
              setSubmitLoading(false);
            });
        }

        read();
      })
      .catch((err) => {
        updateErrMsg(err.toString());
        setSubmitLoading(false);
      });
  }

  function handleKeyDown(event: any) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();

      if (!submitLoading) {
        handleSubmit();
      }
    }
  }

  function handleSave() {
    // cause we always have a system message at the first
    if (conversations.length < 2) return;
    setSaving(true);
    updateSavingStatus(true);

    const node = document.getElementById("save-as-image");
    if (node) {
      toPng(node)
        .then(function (dataUrl) {
          setSaving(false);
          updateSavingStatus(false);
          download(dataUrl, "conversations.png");
        })
        .catch(function (error) {
          setSaving(false);
          updateSavingStatus(false);
          updateErrMsg(`Oops, something went wrong: ${error}`);
        });
    }
  }

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={`my-10 w-full max-w-5xl px-4 text-center sm:flex sm:items-center`}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={1}
        className="w-full rounded-md border-2 border-gray-300 p-3 shadow-sm focus:border-black focus:outline-0 dark:border-gray-700 dark:bg-slate-900 dark:focus:border-gray-600"
        placeholder={
          submitLoading
            ? "你心里已经有了答案"
            : `盛开或者不盛开的都是玫瑰.${isMobile ? "" : " (创意交流v：15522668322)"}`
        }
        onKeyDown={handleKeyDown}
      />
      <button
        className={`mt-3 h-10 w-40 rounded-md bg-black font-medium text-white hover:bg-slate-700 dark:bg-slate-300 dark:text-black dark:hover:bg-slate-400 sm:ml-3 sm:mt-0 sm:w-48 ${
          submitLoading ? "animate-pulse" : ""
        }`}
        onClick={handleSubmit}
        disabled={submitLoading}
      >
        {submitLoading ? "Waiting" : "Submit"}
      </button>
      <button
        className={`ml-3 mt-3 h-10 w-14 rounded-md border border-black font-medium text-black hover:bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700 sm:mt-0 sm:w-28 ${
          submitLoading ? "animate-pulse" : ""
        }`}
        onClick={handleClear}
        disabled={submitLoading}
      >
        Clear
      </button>
      <button
        className="ml-3 mt-3 h-10 w-14 rounded-md border border-black font-medium text-black hover:bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700 sm:mt-0 sm:w-28"
        onClick={handleSave}
        disabled={saving}
      >
        Save
      </button>

      {/* The stop button is fixed to the header. */}
      {submitLoading ? (
        <button
          className={`fixed left-1/2 top-5 z-20 h-6 w-14 -translate-x-1/2 rounded border border-black font-normal text-black dark:border-white dark:text-white`}
          onClick={handleStop}
        >
          Stop
        </button>
      ) : (
        ""
      )}
    </div>
  );
}
