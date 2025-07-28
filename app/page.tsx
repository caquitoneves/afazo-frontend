"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Plus, Trash2, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  const [isDark, setIsDark] = useState<boolean | null>(null);

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

  // Detecta o tema no primeiro carregamento
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  // Atualiza o tema quando isDark mudar
  useEffect(() => {
    if (isDark === null) return;
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
  };

  if (isDark === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white transition-colors duration-500 font-poppins p-4">
        <div>Carregando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 dark:from-gray-900 to-white dark:to-gray-950 transition-colors duration-500 font-poppins p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800 dark:text-white rounded-3xl shadow-2xl p-8 relative"
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={isDark}
            onCheckedChange={toggleTheme}
            aria-label="Alternar tema"
            className="border border-gray-300 dark:border-gray-600 shadow cursor-pointer"
          />
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </label>

        <motion.h1
          className="text-4xl font-extrabold text-blue-600 mb-8 text-center tracking-tight drop-shadow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          afazo
        </motion.h1>

        <motion.form
          className="flex gap-2 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-1 border border-gray-300 data-[mode=dark]:border-gray-600 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 data-[mode=dark]:bg-gray-700 data-[mode=dark]:text-white text-lg"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-1 shadow"
          >
            <Plus size={20} />
          </button>
        </motion.form>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar tarefa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 data-[mode=dark]:border-gray-600 px-4 py-2 rounded-xl data-[mode=dark]:bg-gray-700 data-[mode=dark]:text-white"
          />
          <div className="flex gap-2 justify-center md:justify-end">
            {["all", "pending", "done"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200 ${
                  filter === type
                    ? type === "pending"
                      ? "bg-yellow-400 text-white"
                      : type === "done"
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white"
                    : "bg-gray-100 data-[mode=dark]:bg-gray-700 text-gray-700 data-[mode=dark]:text-gray-200"
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

        <motion.ul
          className="space-y-3 min-h-[120px]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
        >
          {paginatedTasks.map((task) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22 }}
              className="flex justify-between items-center bg-gray-50 data-[mode=dark]:bg-gray-700 border border-gray-200 data-[mode=dark]:border-gray-600 p-4 rounded-xl shadow-sm hover:shadow-md"
            >
              <span
                onClick={() => toggleTask(task.id)}
                className={`flex-1 cursor-pointer select-none text-lg transition-colors duration-200 ${
                  task.completed
                    ? "line-through text-gray-400"
                    : "text-gray-800 data-[mode=dark]:text-white"
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => setTaskToDelete(task)}
                className="text-red-500 hover:text-red-600 ml-4"
                aria-label="Excluir tarefa"
              >
                <Trash2 size={22} />
              </button>
            </motion.li>
          ))}
        </motion.ul>

        {hasMore && (
          <div
            ref={loaderRef}
            className="h-4 w-full mt-4 animate-pulse bg-blue-100 data-[mode=dark]:bg-blue-900 rounded"
          />
        )}

        {filteredTasks.length > itemsPerPage && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-gray-200 data-[mode=dark]:bg-gray-700 hover:bg-gray-300 data-[mode=dark]:hover:bg-gray-600 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={loadMore}
              disabled={!hasMore}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}

        {taskToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white data-[mode=dark]:bg-gray-800 data-[mode=dark]:text-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center"
            >
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
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 bg-gray-200 data-[mode=dark]:bg-gray-700 hover:bg-gray-300 data-[mode=dark]:hover:bg-gray-600 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
