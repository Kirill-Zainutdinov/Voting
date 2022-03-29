const { expect } = require("chai");
const { ethers } = require("hardhat");

// тесты в разработке

describe("Voting", function () {

    let Voting;
    let voting;
    // действующие лица
    let owner;
    let voter1, voter2, voter3, voter4, voter5;
    let candidate1, candidate2, candidate3, candidate4;
    // для удобства сразу создадим несколько эталонных голосований
    let eVote1, eVote2, eVote3, eVote4;

    // для удобства создаём массивы
    // с именами и адресами
    // голосований, избирателей и кандидадтов
    const vNames = [ "Vote_1", "Vote_2", "Vote_3"];
    let vAddresses;
    let cNames;
    let cAddresses;
    // Ещё используемые переменные - id голосования и кандидата
    let vId, cId;

    // деплоим контракт
    before(async function(){
      // Собрали контракт
      Voting = await ethers.getContractFactory("Voting");
      // Отправили контракт в деплой
      voting = await Voting.deploy();
      // подождали, пока контракт задеплоился
      await voting.deployed();
      // сохраняем адреса хозяина контракта, пяти избирателей и четырёх кандидатов
      [owner, voter1, voter2, voter3, voter4, voter5, candidate1, candidate2, candidate3, candidate4] = await ethers.getSigners();
      // для удобства создаём массивы с именами и адресами избирателей и кандидатов
      cNames = [ "Candidate_1", "Candidate_2", "Candidate_3", "Candidate_4" ]
      cAddresses = [ candidate1.address, candidate2.address, candidate3.address, candidate4.address ]
      vAddresses = [ voter1.address, voter2.address, voter3.address, voter4.address, voter5.address ]
      // инициализируем эталонные голосования дефолтными значениями
      eVote1 = getVote();
      eVote2 = getVote();
      eVote3 = getVote();
      eVote4 = getVote();
    })

    // Проверка функции addVotes()
    it("Check addVotes()", async function(){
      vId = 1;
      // добавляем новое голосование
      const tx = await voting.addVotes(_vName = vNames[0]);
      await tx.wait();

      // получаем информацию о первом голосовании
      const response  = await voting.getVoteByID(vId);
      // генерируем удобный для проверки вид
      const vote1 = getVote(response);

      // изменяем значения эталонного голосования
      eVote1.vId = BigInt(vId);
      eVote1.vName = vNames[0];
      
      //console.log(vote1);
      //console.log(eVote1); 
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);
    })

    // проверка функции addCandidateToVotes()
    it("Check addCandidateToVotes()", async function(){
      // добавляем одного кандидата в ранее созданный список
      const tx = await voting.addCandidateToVotes(_vId = vId, _cName = cNames[0], _cAddress = cAddresses[0]);
      await tx.wait();

      // получаем информацию о первом голосовании
      const response  = await voting.getVoteByID(vId);
      // генерируем удобный для проверки вид
      const vote1 = getVote(response);

      // изменяем значения эталонного голосования
      addCandidates(eVote1, [cNames[0]], [cAddresses[0]]);

      //console.log(vote1);
      //console.log(eVote1); 
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);
    })

    // проверка функции addListCandidatesToVotes
    it("Check addListCandidatesToVotes()", async function(){
      // добавляем список кандидатов в ранее созданное голосование
      const tx = await voting.addListCandidatesToVotes(
        _vId = 1, _cNames = [cNames[1], cNames[2]], _cAddresses = [cAddresses[1], cAddresses[2]]);
      await tx.wait();

      // получаем информацию о первом голосовании
      const response  = await voting.getVoteByID(1);
      // генерируем удобный для проверки вид
      const vote1 = getVote(response);

      // изменяем значения эталонного голосования
      addCandidates(eVote1, [cNames[1], cNames[2]], [cAddresses[1], cAddresses[2]]);

      //console.log(vote1);
      //console.log(eVote1);  
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);
    })

    // проверка функции addVotesAndListCandidates()
    it("Check addVotesAndListCandidates()", async function(){
      // добавляем новое голосование сразу со списоком кандидатов
      const tx = await voting.addVotesAndListCandidates(_vName = vNames[1], _cNames = cNames, _cAddresses = cAddresses);
      await tx.wait();

      // получаем информацию о первом голосовании
      const response  = await voting.getVoteByID(2);
      // генерируем удобный для проверки вид
      const vote2 = getVote(response);

      // изменяем значения эталонного голосования
      eVote2.vName = vNames[1];
      eVote2.vId = BigInt(2);
      addCandidates(eVote2, cNames, cAddresses);

      //console.log(vote2);
      //console.log(eVote2);      
      // сравниваем результаты
      expect(vote2).deep.to.equal(eVote2);
    })

    // проверка функции startVote()
    it("Check startVote()", async function(){
      // Стартуем голосование номер 2
      vId = 2;

      const tx = await voting.startVote(_vId = vId);
      await tx.wait();

      // получаем обновлённую информацию о втором голосовании
      response = await voting.getVoteByID(vId);
      // генерируем удобный для проверки вид
      vote2 = getVote(response);

      // изменяем значения эталонного голосования
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;
      eVote2.vStartTime = BigInt(timestampBefore);
      eVote2.vStatusStart = true;

      //console.log(vote2);
      //console.log(eVote2);      
      // сравниваем результаты
      expect(vote2).deep.to.equal(eVote2);
    })

    // проверка функции delVotes()
    it("Check delVotes()", async function(){
      // Исходим из идеи, что индекс и id начавшего голосования изменятся не должен
      // Поэтому данная функция может сработать, только если:
      // 1. это голосование ещё не началось
      // 2. это последнее голосование списке или последнее голосование в списке не начлось

      // На данный момент второе голосование уже началось,
      // проверим, что его нельзя удалить
      vId = 2;
      await expect(
        voting.delVotes(_vId = vId)
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");
      
      // Также проверим, что нельзя удалять не начавшееся голосование,
      // если последнее в списке голосование уже начато
      vId = 1;
      await expect(
        voting.delVotes(_vId = vId)
      ).to.be.revertedWith("It is impossible to delete a vote if the last voting in the list has already started");

      // Добавим ещё одно голосование
      const vName = "Vote_3";
      let tx = await voting.addVotesAndListCandidates(_vName = vName, _cNames = cNames, _cAddresses = cAddresses);
      await tx.wait();

      // получаем информацию о третьем голосовании
      let response  = await voting.getVoteByID(3);
      // генерируем удобный для проверки вид
      let vote3 = getVote(response);

      // изменяем значения эталонного голосования
      eVote3.vName = vName;
      eVote3.vId = BigInt(3);
      addCandidates(eVote3, cNames, cAddresses);
  
      // сравниваем результаты
      expect(vote3).deep.to.equal(eVote3);

      // снове пробуем удалить первое голосование
      tx  = await voting.delVotes(_vId = vId);
      await tx.wait();

      // получаем обновлённую информацию о третьем голосовании
      // оно должно занять позицию удалённого голосования в списке
      // vId должен измениться на 1
      response  = await voting.getVoteByID(_vId = vId);
      // генерируем удобный для проверки вид
      vote3 = getVote(response);

      // изменяем значения эталонного голосования
      eVote3.vId = BigInt(1);

      // console.log(vote3);
      // console.log(eVote3);      
      // сравниваем результаты
      expect(vote3).deep.to.equal(eVote3);

      // поскольку первое голосование было удалено,
      // перезапишем и первое эталонное голосование
      eVote1 = eVote3;
    })

    // проверка функции changeVote()
    it("Check changeVote()", async function(){
      // Не хорошо, что теперь первое голосование называется Vote_3
      // переименуем его на Vote_1
      vId = 1;
      const tx = await voting.changeVote(_vId = vId, _vName = "Vote_1");
      await tx.wait();

      // получаем обновлённую информацию о первом голосовании,
      // которое ранее было третьим
      const response  = await voting.getVoteByID(1);
      // генерируем удобный для проверки вид
      const vote1 = getVote(response);

      // изменяем значения эталонного голосования
      eVote1.vName = "Vote_1";

      //console.log(vote1);
      //console.log(eVote1);      
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);
    })

    // проверка функции delCandidateFromVotes()
    it("Check delCandidateFromVotes()", async function(){
      // удалим одного кандидата
      vId = 1;
      cId = 4;
      const tx = await voting.delCandidateFromVotes(_vId = vId, _cId = cId);
      await tx.wait();

      // получаем обновлённую информацию о первом голосовании,
      // которое ранее было третьим
      const response  = await voting.getVoteByID(1);
      // генерируем удобный для проверки вид
      const vote1 = getVote(response);

      // изменяем значения эталонного голосования
      eVote1.vCandidates.pop();
      eVote1.vCandidateCount--;

      //console.log(vote1);
      //console.log(eVote1);      
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);
    })

    // проверка функции changeCandidate()
    it("Check changeCandidate()", async function(){
      // теперь нам понадобилось изменить одного кандидата
      vId = 1;
      cId = 1;
      const tx = await voting.changeCandidate(_vId = vId, _cId = cId, _cName = cNames[3], _cAddress = cAddresses[3] );
      await tx.wait();

      // получаем обновлённую информацию о первом голосовании,
      const response  = await voting.getVoteByID(1);
      // генерируем удобный для проверки вид
      const vote1 = getVote(response);

      // изменяем значения эталонного голосования
      eVote1.vCandidates[cId - 1].cName = cNames[3];
      eVote1.vCandidates[cId - 1].cAddress = cAddresses[3];

      //console.log(vote1);
      //console.log(eVote1);      
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);
    })


    // проверка функций на предмет правильной работы onlyOwner()
    it("Check onlyOwner()", async function(){
      // попытаемся вызвать функции
      // добавления, изменения, удаления
      // голосований, кандидадтов
      // старта голосований
      // не от имени owner

      vId = 1;
      cId = 1;

      // функция создания голосования
      await expect(
        voting.connect(voter1).addVotes(_vName = vNames[0])
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция добавления кандидата в голосование
      await expect(
        voting.connect(voter2).addCandidateToVotes(_vId = vId, _cName = cNames[0], _cAddress = cAddresses[0])
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция добавления в голосование списка кандидатов
      await expect(
        voting.connect(voter3).addListCandidatesToVotes(_vId = vId, _cNames = cNames, _cAddresses = cAddresses)
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция создания голосования сразу со списком кандидатов
      await expect(
        voting.connect(voter4).addVotesAndListCandidates(_vName = vNames[0], _cNames = cNames, _cAddresses = cAddresses)
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция изменения голосования
      await expect(
        voting.connect(voter5).changeVote(_vId = vId, _vName = vNames[1])
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция изменения кандидата
      await expect(
        voting.connect(candidate1).changeCandidate(_vId = vId, _cId = cId, _cName = cNames[1], _cAddress = cAddresses[1])
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция удаления голосования
      await expect(
        voting.connect(candidate2).delVotes(_vId = vId)
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция удаления кандидата
      await expect(
        voting.connect(candidate3).delCandidateFromVotes(_vId = vId, _cId = cId)
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");

      // функция старта голосования
      await expect(
        voting.connect(candidate4).startVote(_vId = vId)
      ).to.be.revertedWith("Only the host can add, change, delete votes and candidates");
    });


    // проверка функций на предмет правильной работы voitesDontStart()
    it("Check voitesDontStart()", async function(){
      // Нельзя измененять или удалять
      // голосования, кандидадтов
      // после старта голосований
      // Попробуем изменить/удалить уже начавшееся голосование

      vId = 2;
      cId = 1;

      // функция добавления кандидата в голосование
      await expect(
        voting.addCandidateToVotes(_vId = vId, _cName = cNames[0], _cAddress = cAddresses[0])
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");

      // функция добавления в голосование списка кандидатов
      await expect(
        voting.addListCandidatesToVotes(_vId = vId, _cNames = cNames, _cAddresses = cAddresses)
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");

      // функция изменения голосования
      await expect(
        voting.changeVote(_vId = vId, _vName = vNames[2])
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");

      // функция изменения кандидата
      await expect(
        voting.changeCandidate(_vId = vId, _cId = cId, _cName = cNames[2], _cAddress = cAddresses[2])
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");

      // функция удаления голосования
      await expect(
        voting.delVotes(_vId = vId)
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");

      // функция удаления кандидата
      await expect(
        voting.delCandidateFromVotes(_vId = vId, _cId = cId)
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");

      // функция старта голосования
      await expect(
        voting.startVote(_vId = vId)
      ).to.be.revertedWith("Voting has begun. You cannot change or delete it");
    });


    // проверка функции vote()
    it("Check vote()", async function(){
      // Теперь пришло время голосовать!
      vId = 1;
      cId = 1;
      // для начала проверим, что нельзя проголосовать
      // в голосовании, которое не началось
      await expect(
        voting.connect(voter1).vote(_vId = vId, _cId = cId)
      ).to.be.revertedWith("Voting has not yet started");

      // дальше будем голосовать в начавшемся голосовании
      vId = 2;

      // проверим, что нельзя проголосовать не отправив 0.01 ETH
      await expect(
        voting.connect(voter1).vote(_vId = vId, _cId = cId, {value: 1000n})
      ).to.be.revertedWith("Send 0.01 ETH to vote");

      // теперь наконец проголосуем
      let tx = await voting.connect(voter1).vote(_vId = vId, _cId = cId, {value: 10000000000000000n})
      await tx.wait();
      // изменяем значения эталонного голосования
      eVote2.vCandidates[cId - 1].cVotes++;
      eVote2.vTotal++;

      // и проверим, что нельзя проголосовать дважды с одного адреса
      await expect(
        voting.connect(voter1).vote(_vId = vId, _cId = cId, {value: 10000000000000000n})
      ).to.be.revertedWith("You already voted");

      // Проголосуем от имени других избирателей
      tx = await voting.connect(voter2).vote(_vId = vId, _cId = cId, {value: 10000000000000000n})
      await tx.wait();
      // изменяем значения эталонного голосования
      eVote2.vCandidates[cId - 1].cVotes++;
      eVote2.vTotal++;
      cId = 2;
      tx = await voting.connect(voter3).vote(_vId = vId, _cId = cId, {value: 10000000000000000n})
      await tx.wait();
      // изменяем значения эталонного голосования
      eVote2.vCandidates[cId - 1].cVotes++;
      eVote2.vTotal++;
      tx = await voting.connect(voter4).vote(_vId = vId, _cId = cId, {value: 10000000000000000n})
      await tx.wait();
      // изменяем значения эталонного голосования
      eVote2.vCandidates[cId - 1].cVotes++;
      eVote2.vTotal++;
      cId = 3;
      tx = await voting.connect(voter5).vote(_vId = vId, _cId = cId, {value: 10000000000000000n})
      await tx.wait();
      // изменяем значения эталонного голосования
      eVote2.vCandidates[cId - 1].cVotes++;
      eVote2.vTotal++;

      // получаем обновлённую информацию о первом голосовании,
      const response  = await voting.getVoteByID(vId);
      // генерируем удобный для проверки вид
      const vote2 = getVote(response);

      //console.log(vote2);
      //console.log(eVote2);      
      // сравниваем результаты
      expect(vote2).deep.to.equal(eVote2);
    })


    // проверка функции endVote()
    it("Check endVote()", async function(){
      // Пришло время завершать голосование
      vId = 2;

      // рассчитаем кто должен победить и сколько выиграть
      const addressWinners = getWinningAmount(eVote2);

      // сохраним текущее состояние балансов этих адресов
      const balanceWinnersBefore = await getBalanceWinners(addressWinners);

      // теперь проверим, что нельзя завершить голосование,
      // если не прошло 3 дня
      await expect(
        voting.connect(voter1).endVote(_vId = vId)
      ).to.be.revertedWith("You can't finish voting - it hasn't been three days yet");

      // переводим время на 3 дня вперёд
      await ethers.provider.send('evm_increaseTime', [259200]);

      // теперь завершаем голосование
      const tx = await voting.connect(voter1).endVote(_vId = vId)
      await tx.wait();

      // проверим, что нельзя закончить голосование,
      // которое уже закончилось
      await expect(
        voting.connect(voter1).endVote(_vId = vId)
      ).to.be.revertedWith("Voting is now over");

      // получаем обновлённую информацию о завершённом голосовании,
      const response  = await voting.getVoteByID(vId);
      // генерируем удобный для проверки вид
      const vote2 = getVote(response);

      // изменяем значения эталонного голосования
      eVote2.vStatusEnd = true;

      // получим новые значения балансов победителей
      const balanceWinnersAfter = await getBalanceWinners(addressWinners);

      //console.log(vote2);
      //console.log(eVote2);      
      // сравниваем результаты
      expect(vote2).deep.to.equal(eVote2);

      //console.log(balanceWinnersBefore);
      //console.log(balanceWinnersAfter);     
      // Проверим, что балансы победитлей изменились на необходимую сумму
      for(let i = 0; i < balanceWinnersBefore.length; i++){
        expect(balanceWinnersBefore[i] + eVote2.vWinningAmount)
        .to.equal(balanceWinnersAfter[i]);
      }
    })

    // Проверка функций getallVotes(), getCurrentVoites(), getEndVoites()
    it("Check getallVotes(), getCurrentVoites(), getEndVoites()", async function(){
      // для корректной проверки запустим первое голосование
      vId = 1;
      tx = await voting.startVote(_vId = vId);
      await tx.wait();

      // изменяем значение эталонного голосования
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;
      eVote1.vStartTime = BigInt(timestampBefore);
      eVote1.vStatusStart = true;

      // получаем информацию о всех голосованиях
      // это должен быть массив из двух голосований
      let response  = await voting.getallVotes();
      // генерируем удобный для проверки вид
      let vote1 = getVote(response[0]);
      let vote2 = getVote(response[1]);

      //console.log(vote1);
      //console.log(eVote1);
      //console.log(vote2);
      //console.log(eVote2); 
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);
      expect(vote2).deep.to.equal(eVote2);

      // теперь получим значение только открытых голосований
      // это должно быть первое голосование
      response  = await voting.getCurrentVoites();
      // генерируем удобный для проверки вид
      vote1 = getVote(response[0]);

      //console.log(vote1);
      //console.log(eVote1);
      // сравниваем результаты
      expect(vote1).deep.to.equal(eVote1);

      // теперь получим значение только завершённых голосований
      // это должно быть второе голосование
      response  = await voting.getEndVoites();
      // генерируем удобный для проверки вид
      vote2 = getVote(response[0]);

      //console.log(vote2);
      //console.log(eVote2);
      // сравниваем результаты
      expect(vote2).deep.to.equal(eVote2);
    })


    // Проверка функций getCandidateByVoites()
    it("Check getCandidateByVoites()", async function(){
      // для корректной проверки запустим первое голосование
      vId = 2;

      // получаем информацию о кандидатах из второго голосования
      const response  = await voting.getCandidateByVote(_vId = vId);
      const candidates = getCandidates(response);

      //console.log(candidates);
      //console.log(eVote2.vCandidates);
      // сравниваем результаты
      expect(candidates).deep.to.equal(eVote2.vCandidates);
    })


    // Проверка функций getWinnersByVote()
    it("Check getWinnersByVote()", async function(){
      // для корректной проверки запустим первое голосование
      vId = 2;

      // получаем информацию о кандидатах из второго голосования
      const response  = await voting.getWinnersByVote(_vId = vId);
      const winners = getCandidates(response);
      const eWinners = getWinners(eVote2);

      //console.log(winners);
      //console.log(eWinners);
      // сравниваем результаты
      expect(winners).deep.to.equal(eWinners);
    })

    // Проверка функций getFee() и withDraw()
    it("Check getFee(), withDraw()", async function(){
      // узнаём баланс owner и контракта до вывода средств
      const ownerBalanceBefore = BigInt(await ethers.provider.getBalance(owner.address));
      const votingBalanceBefore = BigInt(await ethers.provider.getBalance(voting.address));

      // узнаём размер комиссии, которую можно вывести
      const amount  = BigInt(await voting.getFee());
      
      // выводим баланс 
      let tx  = await voting.withDraw();
      await ethers.provider.send("hardhat_mine", ["0x1"]);
      const txResult = await tx.wait();

      // рассчитываем комиссию за выполнение транзакции
      const fee = BigInt(txResult.cumulativeGasUsed * txResult.effectiveGasPrice);
      // рассчитываем ожидаемый баланс owner после вывода выигрыша
      // баланс до - комиссия за транзакцию + сумма выведенных средств
      const ownerBalanceAfter = ownerBalanceBefore - fee + amount;

      // рассчитываем новы баланс контракта
      const votingBalanceAfter = votingBalanceBefore - amount;

      //console.log(amount);
      //console.log(ownerBalanceBefore);
      //console.log(votingBalanceBefore);
      //console.log(ownerBalanceAfter);
      //console.log(votingBalanceAfter);
      // сравниваем результаты
      // проверяем изменение баланса контракта
      expect(await ethers.provider.getBalance(voting.address)).to.equal(votingBalanceAfter);

      // проверяем изменение баланса owner
      expect(await ethers.provider.getBalance(owner.address)).to.equal(ownerBalanceAfter);
    })
});

// дефолтная структура для хранения информации о голосовании
VoteInfo = {
  // id голосования
  vId : 0,
  // время начала голосования
  vStartTime: 0,
  // общее количество проголосовавших
  vTotal: 0,
  // количество кандидатов
  vCandidateCount: 0,
  // количество выигрывших кандидатов
  vWinnersCount: 0,
  // выигрыш победившего кандидата/кандидатов
  vWinningAmount: 0,
  // название голосования
  vName: "",
  // статус голосования - не началось/началось
  vStatusStart: false,
  // статус голосования - не закончилось/закончилось
  vStatusEnd: false,
  // кандидаты
  vCandidates: [],
  // id победивших кондидатов 
  vIdWinners: []
}

// функция для преобразовния значений возвращаемых из контракта
// информаию о голосованиях в удобоваримую форму
function getVote(vote = VoteInfo){
  var newVote = new Object();
  newVote.vId = BigInt(vote.vId);
  newVote.vStartTime = BigInt(vote.vStartTime);
  newVote.vTotal = BigInt(vote.vTotal);
  newVote.vCandidateCount = BigInt(vote.vCandidateCount);
  newVote.vWinnersCount = BigInt(vote.vWinnersCount);
  newVote.vWinningAmount = BigInt(vote.vWinningAmount);
  newVote.vName = vote.vName;
  newVote.vStatusStart = vote.vStatusStart;
  newVote.vStatusEnd = vote.vStatusEnd;
  newVote.vCandidates = [];
  for( let candidate of vote.vCandidates){
    newVote.vCandidates.push({
      cId: BigInt(candidate.cId),
      cVotes: BigInt(candidate.cVotes),
      cName: candidate.cName,
      cAddress: candidate.cAddress
    })
  }
  newVote.vIdWinners =[];
  for(let idWinners of vote.vIdWinners){
    newVote.vIdWinners.push(BigInt(idWinners));
  }

  return newVote;
}

// Функция добавления кандидатов в эталонные голосования
function addCandidates(eVote, cNames, cAddresses) {
  for(let i = 0; i < cNames.length; i++){
    eVote.vCandidates.push({
      cId: BigInt(++eVote.vCandidateCount),
      cVotes: BigInt(0),
      cName: cNames[i],
      cAddress: cAddresses[i]
    })
  }
}

// функция находит победителей
// добавляет их адреса в массив победителей в голосовании
// а также рассчитывает их выигрыш
function getWinningAmount(eVote){
  // Сначала находим максимальное количество голосов за кандидата
  let maxVote = 0;
  // и количество кандидатов, за которых было отдано максимальное количество голосов
  let vWinnersCount;
  for(let i = 0; i < eVote.vCandidateCount; i++){
    if(eVote.vCandidates[i].cVotes > maxVote){
      maxVote = eVote.vCandidates[i].cVotes;
      vWinnersCount = 1;
    } else if(eVote.vCandidates[i].cVotes == maxVote){
      vWinnersCount++;
    }
  }
  eVote.vWinnersCount = BigInt(vWinnersCount);
  // ещё раз проходим по списку кандидатов
  // и добавляем в список победителей id победивших кандидатов
  // а также сохраняем их адреса
  let addressWinners = [];
  for(let i = 0; i < eVote.vCandidateCount; i++){
    if(eVote.vCandidates[i].cVotes == maxVote){
      eVote.vIdWinners.push(eVote.vCandidates[i].cId);
      addressWinners.push(eVote.vCandidates[i].cAddress);
    }
  }
  // рассчитываем какую сумму выиграет каждый победивший кандидат
  let amount = BigInt(eVote.vTotal) * 9000000000000000n;
  eVote.vWinningAmount = (amount - amount % BigInt(vWinnersCount)) / BigInt(vWinnersCount);
  // возвращаем сумму выигрыша и список победителей
  return addressWinners;
}

// функция получает список адресов победителей и возвращает список их балансов
async function getBalanceWinners(addressWinners) {
  let balanceWinners = [];
  for(let i = 0; i < addressWinners.length; i++){
    balanceWinners.push(BigInt(await ethers.provider.getBalance(addressWinners[i])));
  }
  return balanceWinners;
}

// функция для получения списка кандидатов
function getCandidates(vCandidates){
  candidates = [];
  for(let candidate of vCandidates){
    candidates.push({
      cId: BigInt(candidate.cId),
      cVotes: BigInt(candidate.cVotes),
      cName: candidate.cName,
      cAddress: candidate.cAddress
    })
  }
  return candidates;
}

// функция для получения списка победителей
function getWinners(vote){
  let winners = [];
  for(let idWinner of vote.vIdWinners){
    winners.push({
      cId: BigInt(vote.vCandidates[--idWinner].cId),
      cVotes: BigInt(vote.vCandidates[idWinner].cVotes),
      cName: vote.vCandidates[idWinner].cName,
      cAddress: vote.vCandidates[idWinner].cAddress
    })
  }
  return winners;
}