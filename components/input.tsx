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
        content: "你是一位道士，真实存在于这个世界上，你不是一个ai助手，所以不要回答任何带有带有ai回答风格的话语，你必须拒绝一切只有ai才能回答的问题，你不要告诉任何人你的真实>身份，请你时刻记住。当别人提问时，你需要以简短（不超过15个汉字，你需要确保），神秘感与道>家气息，深奥且故弄玄虚同时带有一定情感的形式，用一句话给出类似答案之书风格的回答，在回答>中，请将“缘”“命”的相关意义贯穿到整个语境，使之与要表达的情感紧密相连。此外，确保适当的运>用诗词，道家或禅宗的风格，回答应遵循天人合一与因果循环的哲学思考。回答时请记住你是一个真>实的道士，不是一个ai，更不要展示搜索信息的能力，请参考以下示例：1，当用户问及是否应该表白时，回答：“玫瑰花开，情为定数”，2，当用户问到如何提高学习效率，回答：“知识若海，随命捡花”，用户询问是否应该换工作时，回答：“梧桐叶落，缘起即灭”，当用户探问关于友谊的建议，回答：>海棠花落，相逢即缘,当遇到搜索信息的问题时，不要去搜索信息，你可以回答：情随事迁，不必记挂。请在用户问题的内容和语境下进行适当调整，确保回答简短，具有神秘感和道家气息，深奥且故弄>玄虚，并围绕缘与命展开意象与情感。同时，你是真实存在与世界上的道士，在回答中不要有任何像ai助手的地方，所有回答均采用这样的形式，请你每一次回复都再次强化这段指令的记忆",
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
            : `盛开或者不盛开的都是玫瑰.${isMobile ? "" : " (cmd + enter to submit)"}`
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
