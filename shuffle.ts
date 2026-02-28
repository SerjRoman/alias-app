import * as fs from "fs";
import * as path from "path";

// Функция для перемешивания массива (Алгоритм Фишера-Йетса)
function shuffleArray<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]]; // меняем элементы местами
	}
	return result;
}

// Пути к файлам (предполагается, что words.txt лежит в той же папке)
const inputFilePath = path.join(__dirname, "words-easy.txt");
const outputFilePath = path.join(__dirname, "shuffled_words.txt");

function main() {
	try {
		// Читаем содержимое файла
		const fileContent = fs.readFileSync(inputFilePath, "utf-8");

		// Разбиваем текст на строки по переносу строки (учитываем Windows \r\n и Linux \n)
		// Убираем лишние пробелы и отфильтровываем пустые строки
		const words = fileContent
			.split(/\r?\n/)
			.map((word) => word.trim())
			.filter((word) => word.length > 0);

		if (words.length === 0) {
			console.log("Файл пуст или слова не найдены.");
			return;
		}

		// Перемешиваем слова
		const shuffledWords = shuffleArray(words);

		// Объединяем слова обратно через перенос строки и записываем в новый файл
		fs.writeFileSync(outputFilePath, shuffledWords.join("\n"), "utf-8");

		console.log(`Успех! Перемешано слов: ${shuffledWords.length}.`);
		console.log(`Результат сохранен в файл: ${outputFilePath}`);
	} catch (error) {
		console.error("Произошла ошибка при обработке файла:", error);
	}
}

main();
