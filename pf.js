import {  chromium } from 'playwright';
import fs from 'fs';
import axios from 'axios';
import sharp from 'sharp';
import { faker } from '@faker-js/faker';
import devices from './devices.js';
import xlsx from 'node-xlsx';

// API-ключ для Capsola
const CAPSOLASPACE_API_KEY = 'd8ce98fc-ec99-4e75-8a24-9d03fcd8f561';

// Путь к Excel файлу
const excelFilePath = 'keywords.xlsx';

// Чтение Excel файла
const workbook = xlsx.parse(fs.readFileSync(excelFilePath));

// Получение первого листа
const sheet = workbook[0];

// Получение списка ключевых слов из первого столбца
const keywords = sheet.data.slice(1).map(row => row[0]);

// Загрузка списка ключевых слов из файла
//const keywords = fs.readFileSync('keywords.txt', 'utf-8').split('\n');

// Функция для генерации случайных куки
function generateRandomCookies() {
  const domains = [
    'google.com', 'vk.com', 'yandex.ru', 'mail.ru', 'ozon.ru', 'wildberries.ru',
    'avito.ru', 'rbc.ru', 'tinkoff.ru', 'sberbank.ru', 'aliexpress.ru', 'youtube.com',
    'instagram.com', 'facebook.com', 'twitter.com', 'twitch.tv', 'drom.ru', 'hh.ru',
    'kinopoisk.ru', 'lenta.ru', 'ria.ru', 'gazeta.ru', 'sportbox.ru', 'championat.com',
    'pikabu.ru', 'habr.com', 'meduza.io', 'kommersant.ru', 'iz.ru', 'rambler.ru',
    'auto.ru', 'dns-shop.ru', 'citilink.ru', 'eldorado.ru', 'mvideo.ru', 'ozon.travel',
    'booking.com', 'airbnb.ru', 'skyscanner.ru', 'kaspersky.ru', 'doctor.ru',
    'apteka.ru', 'yula.ru', '2gis.ru', 'maps.yandex.ru', 'weather.com', 'afisha.ru',
    'kino-teatr.ru', 'ivi.ru', 'okko.tv', 'megogo.ru', 'netflix.com', 'spotify.com',
    'soundcloud.com', 'shazam.com', 'steamcommunity.com', 'epicgames.com', 'gog.com',
    'playstation.com', 'xbox.com', 'nintendo.ru', 'blizzard.com', 'riotgames.com',
    'wargaming.net', 'warframe.com', 'twitch.tv', 'discord.com', 'telegram.org',
    'whatsapp.com', 'viber.com', 'zoom.us', 'skype.com', 'microsoft.com', 'apple.com',
    'samsung.com', 'huawei.com', 'xiaomi.com', 'lenovo.com', 'asus.com', 'acer.com',
    'dell.com', 'hp.com', 'nvidia.com', 'amd.com', 'intel.com', 'adobe.com',
    'autodesk.com', 'coreldraw.com', 'gimp.org', 'inkscape.org', 'blender.org',
    'unity.com', 'unrealengine.com', 'github.com', 'gitlab.com', 'bitbucket.org',
    'stackoverflow.com', 'w3schools.com', 'mozilla.org', 'opera.com', 'vivaldi.com',
    'brave.com', 'duckduckgo.com', 'baidu.com', 'yahoo.com', 'bing.com', 'ask.com',
    'wolframalpha.com', 'quora.com', 'reddit.com', 'medium.com', 'tumblr.com',
    'pinterest.com', 'deviantart.com', 'behance.net', 'dribbble.com', 'flickr.com',
    'unsplash.com', 'pexels.com', 'shutterstock.com', 'istockphoto.com', 'gettyimages.com',
    'canva.com', 'fiverr.com', 'upwork.com', 'freelancer.com', 'toptal.com', 'guru.com',
    'peopleperhour.com', '99designs.com', 'designcrowd.com', 'crowdspring.com',
    'logomyway.com', 'designhill.com', 'designcontest.com', 'designmantic.com',
    'designpickle.com'
  ];

  const cookies = [];
  for (let i = 0; i < 50; i++) {
    const domain = domains[Math.floor(Math.random() * domains.length)];
    cookies.push({
		name: faker.helpers.arrayElement(['session_id', 'user_id', 'preferences', 'analytics_id', 'last_visit']),
		value: faker.string.uuid(),
		domain: faker.helpers.arrayElement(domains),
		path: '/',
		httpOnly: faker.datatype.boolean(),
		secure: faker.datatype.boolean(),
		sameSite: 'Lax'
    });
  }
  return cookies;
}

// Функция для получения случайного устройства из списка устройств Playwright
function getRandomDevice() {
  const randomIndex = Math.floor(Math.random() * devices.length);
  return devices[randomIndex];
}

// Функция для получения соответствующих заголовков на основе выбранного User-Agent
const getBrowserHeaders = (userAgent) => {
    const isChrome = userAgent.includes('Chrome');
    const isFirefox = userAgent.includes('Firefox');
    const version = isChrome 
        ? userAgent.match(/Chrome\/(\d+)/)[1]
        : userAgent.match(/Firefox\/(\d+)/)[1];

    return {
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'sec-ch-ua': isChrome 
            ? `"Google Chrome";v="${version}", "Chromium";v="${version}"` 
            : `"Firefox";v="${version}"`,
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    };
};

//функция эмуляции человека
async function simulateHumanBehavior(page, depth = 0) {
	console.log('Начало simulateHumanBehavior');
	
	// Защита от слишком глубокой рекурсии
    const MAX_DEPTH = 5;
    if (depth >= MAX_DEPTH) {
        console.log('Достигнут максимальный уровень переходов по ссылкам');
        return;
    }
	
    // Функция случайной задержки
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
    
    // Функция плавного скролла
	async function smoothScroll(targetPosition = null) {
		console.log('Начало плавного скролла');
		await page.evaluate((targetPos) => {
			return new Promise((resolve) => {
				const startPosition = window.pageYOffset;
				const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
				const scrollTo = targetPos !== null ? targetPos : Math.floor(Math.random() * maxScroll);
				const duration = 3000 + Math.random() * 1000; // 3-4 секунды на скролл
				const distance = scrollTo - startPosition;
				let startTime = null;

				function animation(currentTime) {
					if (startTime === null) startTime = currentTime;
					const timeElapsed = currentTime - startTime;
					const progress = Math.min(timeElapsed / duration, 1);

					// Функция плавности
					const easing = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
					
					window.scrollTo(0, startPosition + distance * easing(progress));

					if (timeElapsed < duration) {
						requestAnimationFrame(animation);
					} else {
						resolve();
					}
				}

				requestAnimationFrame(animation);
			});
		}, targetPosition);
		await page.waitForTimeout(randomDelay(500, 1500));
		console.log('Завершение плавного скролла');
	}
	
	// Функция плавного выделения текста
	async function smoothTextSelection() {
		console.log('Начало плавного выделения текста');
		try {
			await Promise.race([
				page.evaluate(() => {
					return new Promise((resolve) => {
						const visibleTextElements = Array.from(document.querySelectorAll('p, div, span'))
							.filter(el => {
								const rect = el.getBoundingClientRect();
								return rect.top >= 0 &&
									   rect.left >= 0 &&
									   rect.bottom <= window.innerHeight &&
									   rect.right <= window.innerWidth &&
									   el.textContent.trim().length > 20;
							});

						if (visibleTextElements.length) {
							const randomElement = visibleTextElements[Math.floor(Math.random() * visibleTextElements.length)];
							
							if (randomElement.firstChild && randomElement.firstChild.nodeType === Node.TEXT_NODE) {
								const text = randomElement.textContent;
								const selection = window.getSelection();
								const range = document.createRange();
								
								range.setStart(randomElement.firstChild, 0);
								selection.removeAllRanges();
								selection.addRange(range);

								let currentPos = 0;
								const endPos = text.length;
								const maxExecutionTime = 10000; // 10 секунд
								const startTime = Date.now();

								const interval = setInterval(() => {
									if (Date.now() - startTime > maxExecutionTime) {
										clearInterval(interval);
										console.log('Достигнуто максимальное время выполнения');
										resolve();
										return;
									}

									currentPos = Math.min(currentPos + 1 + Math.floor(Math.random() * 3), endPos);
									range.setEnd(randomElement.firstChild, currentPos);
									
									if (currentPos >= endPos) {
										clearInterval(interval);
										setTimeout(resolve, 500);
									}
								}, 20 + Math.random() * 30); // Уменьшенное время ожидания
							} else {
								console.log('Выбранный элемент не содержит текстового узла');
								resolve();
							}
						} else {
							console.log('Не найдено подходящих текстовых элементов');
							resolve();
						}
					});
				}),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000)) // 30 секунд таймаут
			]);
		} catch (error) {
			console.error('Ошибка при выделении текста:', error);
		}
		await page.waitForTimeout(randomDelay(500, 1500));
		console.log('Завершение плавного выделения текста');
	}

    try {
        // Массив возможных действий
        const actions = [
            // Скролл страницы
            async () => {
				console.log('Выполнение действия: Скролл страницы');
                await smoothScroll();
            },
            // Движение мышью по тексту
			async () => {
				console.log('Выполнение действия: Движение мышью по тексту');
				try {
					const visibleTexts = await page.evaluate(() => {
						return Array.from(document.querySelectorAll('p, div, span'))
							.filter(el => {
								const rect = el.getBoundingClientRect();
								const style = window.getComputedStyle(el);
								return rect.top >= 0 &&
									   rect.left >= 0 &&
									   rect.bottom <= window.innerHeight &&
									   rect.right <= window.innerWidth &&
									   style.visibility !== 'hidden' &&
									   style.display !== 'none' &&
									   el.textContent.trim().length > 10; // Минимальная длина текста
							})
							.slice(0, 10) // Ограничиваем количество элементов
							.map(el => ({
								selector: el.id ? `#${el.id}` : 
										  el.className ? `.${el.className.split(' ')[0]}` : 
										  'p, div, span'
							}));
					});

					if (visibleTexts.length) {
						const randomText = visibleTexts[Math.floor(Math.random() * visibleTexts.length)];
						const element = await page.locator(randomText.selector).first();
						
						if (await element.isVisible()) {
							const boundingBox = await element.boundingBox();
							if (boundingBox) {
								await smoothScroll(boundingBox.y - 100); // Скролл к элементу с отступом
							}
							await page.waitForTimeout(500);

							// Получаем координаты элемента
							const { x, y, width, height } = boundingBox;

							// Генерируем случайные точки внутри элемента
							const points = [];
							for (let i = 0; i < 3; i++) {
								const randomX = x + Math.random() * width;
								const randomY = y + Math.random() * height;
								points.push({ x: randomX, y: randomY });
							}

							// Перемещаем мышь по сгенерированным точкам
							for (const point of points) {
								await page.mouse.move(point.x, point.y, { steps: 10 });
								await page.waitForTimeout(randomDelay(200, 500));
							}

							await page.waitForTimeout(randomDelay(500, 2000));
						}
					}
				} catch (e) {
					console.log('Ошибка при движении мышью по тексту:', e);
				}
			},
            // Выделение текста
            async () => {
				console.log('Выполнение действия: Выделение текста');
				await smoothTextSelection();
            },
            // Клик по слайдеру
			async () => {
				console.log('Выполнение действия: Клик по слайдеру');
				try {
					const sliderButtons = await page.locator('.slick-dots button, .slick-img-next, .slick-img-prev')
						.filter({ hasText: '' })
						.all();
					if (sliderButtons.length) {
						const randomButton = sliderButtons[Math.floor(Math.random() * sliderButtons.length)];
						
						// Проверяем видимость элемента слайдера
						if (await randomButton.isVisible()) {
							// Получаем координаты элемента слайдера
							const boundingBox = await randomButton.boundingBox();
							if (boundingBox) {
								// Выполняем плавный скролл к элементу слайдера с отступом
								await smoothScroll(boundingBox.y - 100);
							}
							await page.waitForTimeout(500);
							await randomButton.click({ timeout: 5000 });
							await page.waitForTimeout(randomDelay(1000, 3000));
						}
					}
				} catch (e) {
					console.log('Пропуск клика по слайдеру');
				}
			},
            // Разворачивание скрытого текста
            async () => {
				console.log('Выполнение действия: Разворачивание скрытого текста');
                try {
                    const expandButtons = await page.locator('.invisible_content_btn').all();
                    if (expandButtons.length) {
                        const randomButton = expandButtons[Math.floor(Math.random() * expandButtons.length)];
                        await randomButton.click({ timeout: 5000 });
                        await page.waitForTimeout(randomDelay(1000, 2000));
                    }
                } catch (e) {
                    console.log('Пропуск разворачивания текста');
                }
            }
        ];

        // Определяем случайное время пребывания на странице (30-180 секунд)
        const stayTime = randomDelay(30000, 90000);
		console.log(`Запланированное время пребывания на странице: ${stayTime}ms`);
        const startTime = Date.now();

        // Выполняем случайные действия, пока не истечет время
        while (Date.now() - startTime < stayTime) {
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
			console.log('Выполнение случайного действия...');
            await Promise.race([
                randomAction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Действие заняло слишком много времени')), 30000)
                )
            ]).catch(error => {
                console.log('Пропуск действия из-за таймаута:', error.message);
            });
			console.log('Действие завершено');
        }

		console.log('Поиск внутренних ссылок...');
        // Находим все внутренние ссылки
        const links = await page.evaluate(() => {
            const currentOrigin = window.location.origin;
            return Array.from(document.querySelectorAll('a[href]'))
                .filter(link => {
                    const rect = link.getBoundingClientRect();
                    return link.href.startsWith(currentOrigin) &&
                           rect.top >= 0 &&
                           rect.left >= 0 &&
                           rect.bottom <= window.innerHeight &&
                           rect.right <= window.innerWidth;
                })
                .map(link => ({
                    href: link.href,
                    selector: link.id ? `#${link.id}` : 
                             link.className ? `.${link.className.split(' ')[0]}` : 
                             `a[href="${link.href}"]`
                }));
        });
		console.log(`Найдено ${links.length} внутренних ссылок`);

        // Переходим по случайной внутренней ссылке
		if (links.length) {
			console.log(`Найдено ${links.length} внутренних ссылок`);
			
			for (const link of links) {
				console.log(`Попытка перехода по ссылке: ${link.href}`);
				try {
					const linkElements = await page.$$(link.selector);
					console.log(`Найдено ${linkElements.length} элементов, соответствующих селектору`);

					for (const element of linkElements) {
						const isVisible = await element.isVisible();
						console.log(`Элемент видим: ${isVisible}`);
						
						if (isVisible) {
							console.log('Прокрутка к элементу...');
							await element.scrollIntoViewIfNeeded();
							await page.waitForTimeout(randomDelay(500, 1500));

							const currentUrl = page.url();
							console.log(`Текущий URL: ${currentUrl}`);

							console.log('Проверка, является ли элемент кликабельным...');
							const isClickable = await page.evaluate(el => {
								const style = window.getComputedStyle(el);
								return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
							}, element);

							if (isClickable) {
								console.log('Элемент кликабелен. Попытка клика...');
								try {
									// Пробуем несколько методов клика
									await Promise.race([
										element.click({ timeout: 5000 }),
										element.evaluate(el => el.click()),
										page.evaluate(el => el.click(), element)
									]);
									
									console.log('Клик выполнен. Ожидание изменения URL...');
									
									// Ждем изменения URL
									await page.waitForFunction(
										url => window.location.href !== url,
										currentUrl,
										{ timeout: 10000 }
									);
									
									console.log('URL изменился. Ожидание загрузки страницы...');
									await page.waitForLoadState('networkidle', { timeout: 15000 });
									
									const newUrl = page.url();
									console.log(`Новый URL: ${newUrl}`);
									
									if (newUrl !== currentUrl) {
										console.log('Успешный переход по ссылке, глубина:', depth + 1);
										await simulateHumanBehavior(page, depth + 1);
										return;
									} else {
										console.log('URL не изменился после клика, пробуем следующую ссылку');
									}
								} catch (clickError) {
									console.log('Ошибка при клике или навигации:', clickError.message);
								}
							} else {
								console.log('Элемент не кликабелен, пропускаем');
							}
						}
					}
				} catch (e) {
					console.log('Ошибка при обработке ссылки:', e.message);
				}
			}
			console.log('Не удалось перейти ни по одной ссылке');
		}
    } catch (error) {
        console.error('Ошибка при имитации поведения пользователя:', error);
    }
	console.log(`Завершение simulateHumanBehavior, глубина: ${depth}`);
}

// Функция для решения смарт капчи через Capsola
async function solveSmartCaptcha(captchaImageUrl, dataURL) {
	const urlCreate = "https://api.capsola.cloud/create";
	const urlResult = "https://api.capsola.cloud/result";
	const headers = {
	  "Content-Type": "application/json",
	  "X-API-Key": CAPSOLASPACE_API_KEY,
	};
	const CLICK_URL = captchaImageUrl;
	const TASK_URL = dataURL;
	async function loadImageAsBase64(imageUrl) {
	  const response = await fetch(imageUrl);
	  const arrayBuffer = await response.arrayBuffer();
	  const buffer = Buffer.from(arrayBuffer);
	  const base64Image = buffer.toString('base64');
	  return base64Image;
	}
	async function createTask() {
	  const request = await fetch(urlCreate, {
		method: "POST",
		headers: headers,
		body: JSON.stringify({
		  type: "SmartCaptcha",
		  click: await loadImageAsBase64(CLICK_URL),
		  task: await loadImageAsBase64(TASK_URL),
		}),
	  });
	  const { status, response } = await request.json();
	  console.log({ status, response });
	  if (status === 1) return response;
	  console.error("Failed to create task:", response);
	  return null;
	}
	
	async function getResult(taskId) {
	  while (true) {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		const request = await fetch(urlResult, {
		  method: "POST",
		  headers: headers,
		  body: JSON.stringify({ id: taskId }),
		});
		const { status, response } = await request.json();
		console.log({ status, response });
		if (status === 1) {
		  const coordinates = response.split(';').map(coord => {
			const [xStr, yStr] = coord.split(',');
			const x = parseFloat(xStr.split('=')[1]);
			const y = parseFloat(yStr.split('=')[1]);
			return { x, y };
		  });
		  return coordinates;
		}
		if (status === 0 && response !== "CAPCHA_NOT_READY") break;
	  }
	  return null;
	}
	
	async function main() {
	const taskId = await createTask();
	console.log('taskId:', taskId);
	if (taskId) {
	  const result = await getResult(taskId);
	  return result;
	}
	return null;
	}

	return main();

}

// Функция для закрытия модального окна
async function closeModalIfPresent(page) {
  try {
    // Проверяем, видимо ли модальное окно
    const isModalVisible = await page.isVisible('.Modal-Content');
    if (isModalVisible) {
      console.log('Модальное окно обнаружено. Закрываем...');
      // Кликаем по кнопке "Нет, спасибо"
	  try {
		// Пытаемся кликнуть по первой кнопке
		await page.click('.Button2.Distribution-Close', { timeout: 3000 });
		console.log('Первая кнопка закрытия модального окна найдена и кликнута.');
	  } catch (error) {
		console.log('Первая кнопка закрытия модального окна не найдена. Ищем вторую кнопку...');
		try {
		  // Пытаемся кликнуть по второй кнопке
		  await page.click('.Button2.Distribution-SplashScreenModalCloseButtonOuter', { timeout: 3000 });
		  console.log('Вторая кнопка закрытия модального окна найдена и кликнута.');
		} catch (error) {
		  console.log('Вторая кнопка закрытия модального окна не найдена.');
		}
	  }
      console.log('Модальное окно закрыто.');
    }
  } catch (error) {
    console.error('Ошибка при закрытии модального окна:', error.message);
  }
}

// ввод ключевого слова
async function enterSearchQuery(page, query) {
  // Находим элемент поисковой строки и вводим запрос
  await page.fill('input[name="text"]', query);
  // Нажимаем Enter для выполнения поиска
  await page.press('input[name="text"]', 'Enter');
  // Ждем, пока страница загрузится
  await page.waitForLoadState('networkidle');
}


// Ищем кнопку для перехода на следующую страницу
async function goToNextPage(page) {
  try {
    // Ищем кнопку для перехода на следующую страницу для десктопа
    const nextPageButton = await page.$('a.Pager-Item_type_next');
    if (nextPageButton) {
      console.log('Кнопка для перехода на следующую страницу найдена.');
      await Promise.all([
        nextPageButton.click(),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      return true;
    }

    // Ищем кнопку "Показать ещё" для мобильного устройства
    const showMoreButton = await page.$('button.Pager-More');
    if (showMoreButton) {
      console.log('Кнопка для перехода на следующую страницу на мобиле найдена.');
      await Promise.all([
        showMoreButton.click(),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      return true;
    }

    console.log('Кнопка для перехода на следующую страницу не найдена.');
  } catch (error) {
    console.log('Ошибка при переходе на следующую страницу:', error);
  }
  return false;
}

//Навигация по поиску если не нашли ключевое слово на первой странице
async function searchAndNavigate(page, query, browser) {
  // Пытаемся найти сайт на первых пяти страницах
  for (let i = 0; i < 5; i++) {
    try {
      // Проверяем и закрываем модальное окно, если оно появилось
      await closeModalIfPresent(page);

      // Проверяем, редиректит ли нас на капчу
      if (page.url().includes('showcaptcha')) {
        console.log('Капча обнаружена. Проверяем тип капчи...');

        // Проверяем, есть ли кликовая капча
        const isClickCaptcha = await page.locator('#js-button').isVisible();
        if (isClickCaptcha) {
          console.log('Обнаружена кликовая капча. Пытаемся решить...');
          try {
            await page.locator('#js-button').click(); // Кликаем на кнопку "Я не робот"
            console.log('Кликовая капча решена.');

            // Отслеживание перезагрузки страницы
            let reloadPromise = page.waitForNavigation({ waitUntil: 'load' });

            // Ожидание перезагрузки страницы или появления второй капчи
            try {
              await Promise.race([
                reloadPromise,
                page.waitForSelector('.AdvancedCaptcha-ImageWrapper', { timeout: 5000 })
              ]);

              // Проверка наличия второй капчи
              const secondCaptchaExists = await page.evaluate(() => {
                return document.querySelector('.AdvancedCaptcha-ImageWrapper') !== null;
              });

              if (secondCaptchaExists) {
                console.log('Обнаружена смарт капча. Пытаемся решить через Capsola...');

                // Получаем URL изображения капчи
                const captchaImageUrl = await page.locator('.AdvancedCaptcha-ImageWrapper img').getAttribute('src');

                // Извлекаем Data URL из canvas
                await page.waitForSelector('.AdvancedCaptcha-CanvasContainer canvas', { timeout: 100000 });
                const canvasDataUrl = await page.$eval('.AdvancedCaptcha-CanvasContainer canvas', (canvas) => {
                  return canvas.toDataURL(); // Получаем содержимое canvas как Data URL
                });

                if (captchaImageUrl) {
                  // Решаем капчу через Capsola
                  const solution = await solveSmartCaptcha(captchaImageUrl, canvasDataUrl);
                  if (solution) {
                    // Получаем элемент изображения капчи
                    const captchaImage = await page.locator('.AdvancedCaptcha-ImageWrapper img');
                    // Получаем координаты и размеры элемента изображения капчи
                    const captchaBox = await captchaImage.boundingBox();

                    // Кликаем по каждой паре координат на изображении капчи
                    for (const coord of solution) {
                      const { x, y } = coord;

                      // Вычисляем абсолютные координаты клика относительно страницы
                      const clickX = captchaBox.x + x;
                      const clickY = captchaBox.y + y;

                      // Выполняем клик по координатам
                      await page.mouse.click(clickX, clickY);
                      console.log(`Клик по координатам (${clickX}, ${clickY}) выполнен.`);

                      // Добавляем задержку между кликами (опционально)
                      await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    // Нажимаем на кнопку "Отправить"
                    await page.click('button[data-testid="submit"]');
                    console.log('Кнопка "Отправить" нажата.');
                  } else {
                    console.error('Не удалось решить смарт капчу.');
                  }
                } else {
                  console.error('Не удалось получить URL изображения капчи.');
                }
              } else {
                console.log('Вторая капча не появилась');
              }
            } catch (error) {
              console.log('Страница не перезагрузилась и вторая капча не появилась');
            }
          } catch (error) {
            console.error('Ошибка при решении кликовой капчи:', error.message);
            // Закрываем браузер
			if (browser) {
			  await browser.close();
			  console.log('Браузер закрыт');
			}
			// Перезапускаем скрипт
			setTimeout(runScript, 300000);
			console.log('Запускаем скрипт заново');
          }
        }
        await Search(page, browser);
      } else {
        console.log('Капча не обнаружена.');

        const result = await findSiteOnPage(page);
		if (result) {
		  const { element: siteLink, url } = result;
		  console.log('Найденный URL:', url);

		  try {
			console.log('Начинаем процесс перехода на сайт...');

			// Создаем промис для отслеживания новой страницы
			const pagePromise = page.context().waitForEvent('page');

			// Кликаем по ссылке
			await siteLink.click();
			console.log('Клик по ссылке выполнен');

			// Ждем, пока откроется новая страница (если она открывается)
			const newPage = await pagePromise;
			const targetPage = newPage || page;

			console.log(`Работаем с ${newPage ? 'новой' : 'текущей'} страницей`);

			// Ждем загрузки страницы
			await targetPage.waitForLoadState('networkidle');
			console.log('Загрузка страницы завершена');

			const finalUrl = targetPage.url();
			console.log('Финальный URL:', finalUrl);

			if (finalUrl.includes('youclinic.ru')) {
			  console.log('Успешно перешли на youclinic.ru');
			  console.log('Начинаем симуляцию поведения человека...');
			  await simulateHumanBehavior(targetPage);
			  console.log('Симуляция поведения человека завершена');

			  if (newPage) {
				await newPage.close();
				console.log('Новая вкладка закрыта');
				if (browser) {
				  await browser.close();
				  console.log('Браузер закрыт');
				}
				// Перезапускаем скрипт
				setTimeout(runScript, 300000);
				console.log('Запускаем скрипт заново');
			  }

			  return true;
			} else {
			  console.log('Переход выполнен, но не на youclinic.ru');
			}
		  } catch (error) {
			console.error('Ошибка при переходе на сайт:', error);
			if (browser) {
			  await browser.close();
			  console.log('Браузер закрыт');
			}
			// Перезапускаем скрипт
			setTimeout(runScript, 300000);
			console.log('Запускаем скрипт заново');
		  }
		} 
		else {
			  console.log(`Сайт youclinic.ru не найден на ${i + 1} странице.`);
			  const hasNextPage = await goToNextPage(page);
			  if (!hasNextPage) {
				console.log('Достигнут конец результатов поиска.');
				console.log('Сайт не найден во всех результатах поиска. Завершаем работу...');
				if (browser) {
				  await browser.close();
				  console.log('Браузер закрыт');
				}
				// Перезапускаем скрипт
				setTimeout(runScript, 300000);
				console.log('Запускаем скрипт заново');
              }
		}

	}
			}catch (error) {
					console.error('Ошибка при поиске:', error.message);
					if (browser) {
					  await browser.close();
					  console.log('Браузер закрыт');
					}
					// Перезапускаем скрипт
					setTimeout(runScript, 300000);
					console.log('Запускаем скрипт заново');
			   }
		  }
			// Если прошли все 5 страниц и не нашли сайт
			console.log('Сайт не найден на первых 5 страницах. Завершаем работу...');
			if (browser) {
			  await browser.close();
			  console.log('Браузер закрыт');
			}
			// Перезапускаем скрипт
			setTimeout(runScript, 300000);
			console.log('Запускаем скрипт заново');
}


// Ищем элемент, содержащий ссылку на youclinic.ru
async function findSiteOnPage(page) {
  const siteLinks = await page.$$eval('a', links => {
    return links
      .filter(link => {
        try {
          const url = new URL(link.href);
          return url.hostname === 'youclinic.ru' || url.hostname.endsWith('.youclinic.ru');
        } catch {
          return false;
        }
      })
      .map(link => ({ href: link.href, text: link.textContent }));
  });

  if (siteLinks.length > 0) {
    console.log('Сайт youclinic.ru найден на текущей странице.');
    console.log('Найденные ссылки:', siteLinks);
    
    // Выбираем первую найденную ссылку
    const firstLink = siteLinks[0];
    const element = await page.$(`a[href="${firstLink.href}"]`);
    
    return { element, url: firstLink.href };
  }

  console.log('Сайт youclinic.ru не найден на текущей странице.');
  return null;
}


// Функция для имитации плавного скроллинга
async function smoothScroll(page, element) {
  await page.evaluate(async (el) => {
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.pageYOffset - window.innerHeight / 2;
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const duration = 1000; // 1 секунда
    const start = performance.now();

    function step() {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeInOutCubic = progress < 0.5
        ? 4 * progress ** 3
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      window.scrollTo(0, startY + distance * easeInOutCubic);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
    await new Promise(resolve => setTimeout(resolve, duration + 500)); // Ждем завершения анимации
  }, element);
}

// основная функция поиска
async function Search(page, browser) {
  for (const keyword of keywords) {
    console.log(`Поиск по ключевому слову: ${keyword}`);
    
    await enterSearchQuery(page, keyword);
    await closeModalIfPresent(page);
    
    const result = await findSiteOnPage(page);
    if (result) {
      const { element: siteLink, url } = result;
      console.log('Найденный URL:', url);

      try {
        console.log('Начинаем процесс перехода на сайт...');

        // Создаем промис для отслеживания новой страницы
        const pagePromise = page.context().waitForEvent('page');

        // Кликаем по ссылке
        await siteLink.click();
        console.log('Клик по ссылке выполнен');

        // Ждем, пока откроется новая страница (если она открывается)
        const newPage = await pagePromise;
        const targetPage = newPage || page;

        console.log(`Работаем с ${newPage ? 'новой' : 'текущей'} страницей`);

        // Ждем загрузки страницы
        await targetPage.waitForLoadState('networkidle');
        console.log('Загрузка страницы завершена');

        const finalUrl = targetPage.url();
        console.log('Финальный URL:', finalUrl);

        if (finalUrl.includes('youclinic.ru')) {
          console.log('Успешно перешли на youclinic.ru');
          console.log('Начинаем симуляцию поведения человека...');
          await simulateHumanBehavior(targetPage);
          console.log('Симуляция поведения человека завершена');

          if (newPage) {
            await newPage.close();
            console.log('Новая вкладка закрыта');
			if (browser) {
			  await browser.close();
			  console.log('Браузер закрыт');
			}
			// Перезапускаем скрипт
			setTimeout(runScript, 300000);
			console.log('Запускаем скрипт заново');
          }

          return true;
        } else {
          console.log('Переход выполнен, но не на youclinic.ru');
        }
      } catch (error) {
        console.error('Ошибка при переходе на сайт:', error);
		if (browser) {
		  await browser.close();
		  console.log('Браузер закрыт');
		}
		// Перезапускаем скрипт
		setTimeout(runScript, 300000);
		console.log('Запускаем скрипт заново');
      }
    } else {
      console.log('Сайт не найден');
      await searchAndNavigate(page, keyword, browser);
    }
  }
  
  return false;
}



// Основной скрипт
async function runScript() {
	const browser = await chromium.launch({ 
		headless: false,
		args: [
		  '--no-sandbox',
		  '--disable-setuid-sandbox',
		  '--disable-infobars',
		  '--window-position=0,0',
		  '--ignore-certifcate-errors',
		  '--ignore-certifcate-errors-spki-list',
		  '--disable-web-security',
		  '--disable-features=IsolateOrigins,site-per-process',
		  // Дополнительные полезные параметры:
		  '--disable-dev-shm-usage', // Решает проблемы с памятью в Docker
		  '--disable-accelerated-2d-canvas', // Отключает аппаратное ускорение canvas
		  '--disable-gpu', // Отключает использование GPU
		  '--disable-notifications', // Отключает уведомления
		  '--disable-extensions', // Отключает расширения
		  '--disable-background-timer-throttling', // Отключает замедление таймеров в фоновых вкладках
		  '--disable-backgrounding-occluded-windows', // Предотвращает приостановку фоновых вкладок
		  '--disable-breakpad', // Отключает отправку отчетов о сбоях
		  '--disable-component-extensions-with-background-pages', // Отключает фоновые страницы расширений
		],
		// Дополнительные опции запуска
		ignoreDefaultArgs: ['--enable-automation'], // Скрывает признаки автоматизации
	});	
	
	const randomDevice = getRandomDevice();
	console.log(`Выбрано устройство: ${randomDevice.name}`);
	
	const context = await browser.newContext({
		userAgent: randomDevice.userAgent,
		viewport: randomDevice.viewport,
		deviceScaleFactor: randomDevice.deviceScaleFactor,
		isMobile: randomDevice.isMobile,
		hasTouch: randomDevice.hasTouch,
		geolocation: { 
			latitude: 55.7558, 
			longitude: 37.6173 
		},
		permissions: ['geolocation'],
		locale: 'ru-RU', // Установка русской локали
		timezoneId: 'Europe/Moscow', // Установка московского часового пояса
		//proxy: {
		//	server: 'http://135.181.1.248:32557',
		//	username: 'KH7gZ4ksKMKA',
		//	password: 'BpyX4IKSUI'
		//}
	});

	// Расширенный скрипт маскировки
	await context.addInitScript(() => {
		(() => {
			// Базовые параметры
			Object.defineProperty(navigator, 'webdriver', { get: () => false });
			Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
			Object.defineProperty(navigator, 'languages', { get: () => ['ru-RU', 'ru', 'en-US', 'en'] });
			// Добавляем эмуляцию памяти устройства
			Object.defineProperty(navigator, 'deviceMemory', {
				get: () => 8 // типичный объем памяти для ПК
			});
			// Эмуляция количества логических процессоров
			Object.defineProperty(navigator, 'hardwareConcurrency', {
				get: () => 4
			});
			// Эмуляция батареи
			if (navigator.getBattery) {
				navigator.getBattery = () => Promise.resolve({
					charging: true,
					chargingTime: 0,
					dischargingTime: Infinity,
					level: 1
				});
			}

			// Эмуляция соединения
			Object.defineProperty(navigator, 'connection', {
				get: () => ({
					effectiveType: '4g',
					rtt: 50,
					downlink: 10,
					saveData: false
				})
			});
			window.navigator.chrome = { runtime: {} };

			// Маскировка Chrome
			const originalQuery = window.navigator.permissions.query;
			window.navigator.permissions.query = (parameters) => (
				parameters.name === 'notifications' ?
					Promise.resolve({ state: Notification.permission }) :
					originalQuery(parameters)
			);

			// WebGL маскировка
			const getParameter = WebGLRenderingContext.getParameter;
			WebGLRenderingContext.prototype.getParameter = function(parameter) {
				switch (parameter) {
					case 37445: return 'Intel Inc.';
					case 37446: return 'Intel Iris OpenGL Engine';
					default: return getParameter.apply(this, [parameter]);
				}
			};

			// Маскировка производительности
			const originalGetEntries = Performance.prototype.getEntries;
			Performance.prototype.getEntries = function() {
				const entries = originalGetEntries.apply(this, arguments);
				return entries.filter(entry => !entry.name.includes('automation'));
			};

			// Маскировка User Agent данных
			if (navigator.userAgentData) {
				Object.defineProperty(navigator, 'userAgentData', {
					get: () => ({
						brands: [
							{ brand: 'Chrome', version: '91' },
							{ brand: 'Chromium', version: '91' }
						],
						mobile: false,
						platform: 'Windows'
					})
				});
			}

		})();
	});

	// Установка случайных куки
	const randomCookies = generateRandomCookies();
	await context.addCookies(randomCookies);
	const page = await context.newPage();
	
	
	// Эмуляция тач-событий, если устройство поддерживает сенсорный ввод
	if (randomDevice.hasTouch) {
	  await page.evaluate(() => {
		window.ontouchstart = () => {};
		window.ontouchmove = () => {};
		window.ontouchend = () => {};
	  });
	}
	
	// Установка размера области просмотра
	await page.setViewportSize(randomDevice.viewport);

	// Эмуляция типа медиа
	await page.emulateMedia({ media: randomDevice.isMobile ? 'screen' : 'print' });
	
	console.log('Браузер запущен');


	// Переходим на Яндекс
	await page.goto('https://ya.ru');

	// Проверяем и закрываем модальное окно, если оно появилось
	await closeModalIfPresent(page);

	// Проверяем, редиректит ли нас на капчу
	if (page.url().includes('showcaptcha')) {
	  console.log('Капча обнаружена. Проверяем тип капчи...');

	  // Проверяем, есть ли кликовая капча
	  const isClickCaptcha = await page.locator('#js-button').isVisible();
	  if (isClickCaptcha) {
		console.log('Обнаружена кликовая капча. Пытаемся решить...');
		try {
		  await page.locator('#js-button').click(); // Кликаем на кнопку "Я не робот"
		  console.log('Кликовая капча решена.');

		  // Отслеживание перезагрузки страницы
		  let reloadPromise = page.waitForNavigation({ waitUntil: 'load' });

		  // Ожидание перезагрузки страницы или появления второй капчи
		  try {
			await Promise.race([
			  reloadPromise,
			  page.waitForSelector('.AdvancedCaptcha-ImageWrapper', { timeout: 5000 })
			]);

			// Проверка наличия второй капчи
			const secondCaptchaExists = await page.evaluate(() => {
			  return document.querySelector('.AdvancedCaptcha-ImageWrapper') !== null;
			});

			if (secondCaptchaExists) {
			  console.log('Обнаружена смарт капча. Пытаемся решить через Capsola...');

			  // Получаем URL изображения капчи
			  const captchaImageUrl = await page.locator('.AdvancedCaptcha-ImageWrapper img').getAttribute('src');

			  // Извлекаем Data URL из canvas
			  await page.waitForSelector('.AdvancedCaptcha-CanvasContainer canvas', { timeout: 100000 });
			  const canvasDataUrl = await page.$eval('.AdvancedCaptcha-CanvasContainer canvas', (canvas) => {
				return canvas.toDataURL(); // Получаем содержимое canvas как Data URL
			  });

			  if (captchaImageUrl) {
				// Решаем капчу через Capsola
				const solution = await solveSmartCaptcha(captchaImageUrl, canvasDataUrl);
				if (solution) {
				  // Получаем элемент изображения капчи
				  const captchaImage = await page.locator('.AdvancedCaptcha-ImageWrapper img');
				  // Получаем координаты и размеры элемента изображения капчи
				  const captchaBox = await captchaImage.boundingBox();

				  // Кликаем по каждой паре координат на изображении капчи
				  for (const coord of solution) {
					const { x, y } = coord;

					// Вычисляем абсолютные координаты клика относительно страницы
					const clickX = captchaBox.x + x;
					const clickY = captchaBox.y + y;

					// Выполняем клик по координатам
					await page.mouse.click(clickX, clickY);
					console.log(`Клик по координатам (${clickX}, ${clickY}) выполнен.`);

					// Добавляем задержку между кликами (опционально)
					await new Promise(resolve => setTimeout(resolve, 500));
				  }
				  // Нажимаем на кнопку "Отправить"
				  await page.click('button[data-testid="submit"]');
				  console.log('Кнопка "Отправить" нажата.');
				} else {
				  console.error('Не удалось решить смарт капчу.');
				}
			  } else {
				console.error('Не удалось получить URL изображения капчи.');
			  }
			} else {
			  console.log('Вторая капча не появилась');
			}
		  } catch (error) {
			console.log('Страница не перезагрузилась и вторая капча не появилась');
		  }
		} catch (error) {
			console.error('Ошибка при решении кликовой капчи:', error.message);
			// Закрываем браузер
			await browser.close();
			console.log('Браузер закрыт');
			// Перезапускаем скрипт
			setTimeout(runScript, 300000);
			console.log('Запускаем скрипт заново');
		}
	  }
	  await Search(page, browser);
	}
	else{
		console.log('Капча не обнаружена.');
		await Search(page, browser);

	}

};

// Запускаем скрипт
runScript();