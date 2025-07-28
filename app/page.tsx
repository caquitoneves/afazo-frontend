"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<"all" | "done" | "pending">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    // Detect system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const API_URL = "http://localhost:8080/tasks";

  const fetchTasks = async () => {
    const res = await axios.get(API_URL);
    setTasks(res.data);
  };

  const addTask = async () => {
    if (text.trim() === "") return;
    await axios.post(API_URL, { text, completed: false });
    setText("");
    fetchTasks();
  };

  const toggleTask = async (id: number) => {
    await axios.put(`${API_URL}/${id}`);
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchTasks();
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.text
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "done" && task.completed) ||
      (filter === "pending" && !task.completed);
    return matchesSearch && matchesFilter;
  });

  const paginatedTasks = filteredTasks.slice(0, page * itemsPerPage);
  const hasMore = paginatedTasks.length < filteredTasks.length;

  const loadMore = () => {
    if (hasMore) setPage((prev) => prev + 1);
  };

  // Scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) loadMore();
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filteredTasks, hasMore]);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Sincroniza o atributo data-mode do <html> sempre que isDark mudar
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <main className="min-h-screen bg-gray-100 text-gray-800 data-[mode=dark]:bg-gray-900 data-[mode=dark]:text-white flex items-center justify-center font-poppins p-4">
      <div className="bg-white data-[mode=dark]:bg-gray-800 data-[mode=dark]:text-white rounded-2xl shadow-xl p-8 w-full max-w-xl">
        <h1 className="text-3xl font-bold text-blue-600 mb-4 text-center">
          Afazo 📝
        </h1>

        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="text-sm px-3 py-1 rounded-lg bg-gray-200 data-[mode=dark]:bg-gray-700 text-gray-700 data-[mode=dark]:text-gray-200 hover:bg-gray-300 data-[mode=dark]:hover:bg-gray-600"
          >
            {isDark ? "☀️ Claro" : "🌙 Escuro"}
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 data-[mode=dark]:bg-gray-700 data-[mode=dark]:text-white"
          />
          <button
            onClick={addTask}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={18} />
            Adicionar
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar tarefa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2 border px-4 py-2 rounded-lg data-[mode=dark]:bg-gray-700 data-[mode=dark]:text-white"
          />

          <div className="flex gap-2">
            {["all", "pending", "done"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  filter === type
                    ? type === "pending"
                      ? "bg-yellow-400 text-white"
                      : type === "done"
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white"
                    : "bg-gray-200 data-[mode=dark]:bg-gray-700"
                }`}
              >
                {type === "all"
                  ? "Todas"
                  : type === "pending"
                  ? "Pendentes"
                  : "Concluídas"}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-3">
          {paginatedTasks.map((task) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex justify-between items-center bg-gray-50 data-[mode=dark]:bg-gray-700 border border-gray-200 data-[mode=dark]:border-gray-600 p-4 rounded-lg shadow-sm hover:shadow-md"
            >
              <span
                onClick={() => toggleTask(task.id)}
                className={`flex-1 cursor-pointer select-none ${
                  task.completed
                    ? "line-through text-gray-400"
                    : "text-gray-800 data-[mode=dark]:text-white"
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => setTaskToDelete(task)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={20} />
              </button>
            </motion.li>
          ))}
        </ul>

        {hasMore && (
          <div
            ref={loaderRef}
            className="h-4 w-full mt-4 animate-pulse bg-blue-100 rounded"
          />
        )}

        {filteredTasks.length > itemsPerPage && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded bg-gray-200 data-[mode=dark]:bg-gray-700 hover:bg-gray-300 data-[mode=dark]:hover:bg-gray-600 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={loadMore}
              disabled={!hasMore}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}

        {taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white data-[mode=dark]:bg-gray-800 data-[mode=dark]:text-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 data-[mode=dark]:text-white">
                Deseja realmente excluir esta tarefa?
              </h2>
              <p className="mb-6 text-gray-600 data-[mode=dark]:text-gray-300 italic">
                "{taskToDelete.text}"
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    deleteTask(taskToDelete.id);
                    setTaskToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 bg-gray-200 data-[mode=dark]:bg-gray-700 hover:bg-gray-300 data-[mode=dark]:hover:bg-gray-600 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
