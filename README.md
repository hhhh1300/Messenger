# Web Programming HW#4

## 1.Install dependencies
```
yarn
```
## 2.Get Pusher credentials Please refer to the [Pusher Setup](https://github.com/ntuee-web-programming/112-1-unit2-notion-clone#pusher-setup) section for more details.   

## 3.Get Github OAuth credentials Please refer to the [NextAuth Setup](https://github.com/ntuee-web-programming/112-1-unit2-notion-clone#nextauth-setup) section for more details.   

## 4.Create .env.local file in the project root and add the following content:   
```
PUSHER_ID=
NEXT_PUBLIC_PUSHER_KEY=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_CLUSTER=

AUTH_SECRET=<this can be any random string>
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```
## 5.Start the database   
```
docker compose up -d
```
## 6.Run migrations   
```
yarn migrate
```
## 7.Start the development server   
```
yarn dev
```
## 8.Open http://localhost:3000 in your browser   

You also can refer to [112-1-unit2-notion-clone](https://github.com/ntuee-web-programming/112-1-unit2-notion-clone) for the setting.   

## 進階要求
1. **傳送連結**：自動辨識訊息中文字是否為連結。若是連結，則可以透過該連結開啟新視窗。   
2. **自動滾動**：當出現新訊息時，聊天紀錄需自動滾動至最下方。 
3. **自編使用者頭貼**：使用者頭貼可自定義，並存到資料庫，且可從資料庫讀取正確圖片。(請輸入圖片網址，且使用http/https)  