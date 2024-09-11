# Introduction
이 프로젝트는 미텀 계정 추상화의 예제로써, SNS 로그인을 사용한 계정 추상화 3rd party 서비스를 구현하였습니다.

미텀과의 상호작용은 mitumJS를 사용하였습니다.

<br>

## 특징
* Service account, Temporary account를 사용한 미텀 multiSig 계정으로 AA용 계정 생성
* Google OAuth2.0 로그인의 ID token이 유효한 경우, Temporary 계정을 사용하여 AA용 계정 컨트롤
* ID token 재발급시 새로운 Temporary 계정으로 업데이트

Google OAuth 로그인, 토큰 관리 로직과 client, server 실행 방법은 [Oauth2.0 프로젝트](https://github.com/HayoungOh5/Oauth2.0)와 거의 유사하니 해당 프로젝트의 `README.md`를 반드시 참고하세요.

`server/.env` 파일에 반드시 유효한 미텀 네트워크, 테스트 계정을 채우세요.

<br>

## AA 계정 정의
Service 계정과 Temporary 계정을 keys로 하고, threshold는 50인 multiSig 계정입니다.

ID token이 유효한 동안은 temporary key만으로 AA 계정을 컨트롤 할수 있습니다.

ID token이 유효하지 않으면 temporary key가 파기됩니다.

새로운 ID token을 발급 받으면, 새로운 temporary 계정과 Service 계정을 keys로 하고, threshold는 50으로 AA 계정의 Key를 Update합니다.

(이 updateKey 오퍼레이션에는 Service account의 서명 사용)

<br>

# 사용 방법 및 동작 화면

## 1. 첫 화면

<img src="https://github.com/user-attachments/assets/dff7f544-f377-4d29-b233-e93b1b973376" width="600"/>


## 2. `Login with Google` 버튼 클릭시
로그인 및 Authorization token (Auth token) 발급

<img src="https://github.com/user-attachments/assets/b246499f-ecb4-44f9-8853-32e2fb1f2ba1" width="600"/>

로그인 성공시 Login with Google 버튼이 사라짐.

<img src="https://github.com/user-attachments/assets/48ef26f2-06c6-4919-bd3b-df139605cbe5" width="600"/>


## 3. `계정 생성하기` 버튼 클릭시
Auth token을 사용하여, Access token, Refresh token, ID token 발급

ID token 검증, ID token의 유효기간 서버에 기록

service 계정과 temporary 계정 (temp계정)으로 **threshold 50** 짜리 multiSig 계정(AA 계정)을 미텀 네트워크에 배포

(계정 생성 트랜잭션을 polling 했다가 최종 처리 확인시 화면 업데이트됨)


화면 업데이트 까지 약 5초 필요

<img src="https://github.com/user-attachments/assets/19345155-4972-4fa1-be32-7319e175726d" width="600"/>

## 4. `Get Balance of AA account` 버튼 클릭시
AA계정의 잔고 정보를 미텀 digestAPI를 통해 조회

<img src="https://github.com/user-attachments/assets/23777eee-f1ff-4fc6-af21-5550d363baf5" width="600"/>

## 5. `Transfer using AA account` 버튼 클릭시
ID token의 유효기간이 지났는지 확인
* 지났을시, 서버에 저장된 temp 계정을 파기
* 안 지났을시, AA계정을 sender로 currency를 전송하는 오퍼레이션 생성, temp 계정으로 서명하여 배포
    * transfer 트랜잭션을 polling 했다가 최종 처리 확인시 화면 업데이트됨
    * `Get Balance of AA account` 버튼을 통해 줄어든 잔고 확인 가능
 
      
<img src="https://github.com/user-attachments/assets/f62bf34b-57ae-4bf0-bcab-c5a6a7ff383e" width="600"/>

줄어든 잔고 확인

<img src="https://github.com/user-attachments/assets/210f5be9-5d8b-4017-9aa1-bf87832ab49b" width="600"/>

## 6. `Get new ID token (update temp key)` 버튼 클릭시
Refresh token으로 새로운 ID token 발급

ID token 검증, ID token의 유효기간 서버에 기록

새로운 temp 계정과 기존 service 계정으로 AA계정의 Key를 update (이때, 서명은 service 계정으로 수행)
* `Transfer using AA account` 버튼을 통해 새로운 temp키로 AA계정을 컨트롤 하는것을 확인 가능

temp 계정이 바뀌었음을 확인 가능

<img src="https://github.com/user-attachments/assets/d1a36c65-f95f-4620-af46-2ae7080ffe7e" width="600"/>

