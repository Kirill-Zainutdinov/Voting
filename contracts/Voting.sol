// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0;

contract Voting{

    // адрес хозяина контракта
    address owner;

    // структура кандидата
    struct Candidate {
        // id кандидата
        uint cId;
        // количество голосов за кандидата
        uint cVotes;
        // имя кандидата
        string cName;
        // адрес кандидата
        address cAddress;
    } 

    // структура голосования
    struct Vote{
        // id голосования
        uint vId;
        // время начала голосования
        uint vStartTime;
        // общее количество проголосовавших
        uint vTotal;
        // сумма выигрыша
        uint vWinningAmount;
        // название голосования
        string vName;
        // статус голосования - не началось/началось
        bool vStatusStart;
        // статус голосования - не закончилось/закончилось
        bool vStatusEnd;
        // кандидаты
        Candidate[] vCandidates;
        // id победивших кандидатов 
        uint[] vIdWinners;
        // проголосовавшие
        mapping(address => bool) vVoters;
    }

    // Со структурой выше удобно работать, но её невозможно вернуть из функции,
    // так как в ней лежит словарь
    // Структура ниже используется для вывода информации о выборах
    // в ней нету словаря и есть некоторая дополнительная информация
    struct VoteInfo{
        // id голосования
        uint vId;
        // время начала голосования
        uint vStartTime;
        // общее количество проголосовавших
        uint vTotal;
        // количество кандидатов
        uint vCandidateCount;
        // количество выигрывших кандидатов
        uint vWinnersCount;
        // выигрыш победившего кандидата/кандидатов
        uint vWinningAmount;
        // название голосования
        string vName;
        // статус голосования - не началось/началось
        bool vStatusStart;
        // статус голосования - не закончилось/закончилось
        bool vStatusEnd;
        // кандидаты
        Candidate[] vCandidates;
        // id победивших кондидатов 
        uint[] vIdWinners;
    }

    // Массив структур Vote - каждый элемент этого массива - отдельное голосование
    Vote[] allVotes;

    // проверяем, что функцию вызывает owner
    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }

    // проверка, что голосование не началось
    // нужно для редактирования голосований и списков кандидатов
    // не честно изменять голосование, добавлять/редактировать/убирать кандидадтов во время голосования
    modifier voitesDontStart(uint _vId){
        require(allVotes[_vId].vStatusStart == false);
        _;
    }

    constructor(){
        owner = msg.sender;
    }


// *** ФУНКЦИИ ДОБАВЛЕНИЯ ГОЛОСОВАНИЯ И КАНДИДАДТОВ ***

    // функция добавления нового голосования РАБОТАЕТ - РЕФАКТОР - 
    function addVotes(string calldata _vName)external onlyOwner{
        // добавляем голосование
        allVotes.push();
        // сохраняем индекс для удобства
        uint vIndex = allVotes.length - 1;
        // сохраняем в голосовании его название
        allVotes[vIndex].vName = _vName;
        // сохраняем id голосования
        allVotes[vIndex].vId = vIndex + 1;
    }

/* аргументы для проверки
0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
QWERT
*/
    // функция добавления одного нового кандидата в голосование РАБОТАЕТ - РЕФАКТОР - 
    function addCandidateToVotes(
        uint _vId,
        address _cAddress,
        string calldata _cName
    )
        external
        onlyOwner
        voitesDontStart(--_vId)
    {
        // получаем id кандидата
        uint cId = allVotes[_vId].vCandidates.length + 1;
        // добавляем нового кандидата в список
        allVotes[_vId].vCandidates.push(Candidate(cId, 0, _cName, _cAddress));
    }
/* это аргументы для проверки
1
["ASD","ZXC","QWE"]
["0x583031D1113aD414F02576BD6afaBfb302140225","0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB","0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c"]
*/
    // функция добавления кандидатов в голосование списокм РАБОТАЕТ - РЕФАКТОР - 
    function addListCandidateToVotes(
        uint _vId,
        string[] calldata _cNames,
        address[] calldata _cAddresses
    )
        external
        onlyOwner
        voitesDontStart(--_vId)
    {
        // получаем id кандидата
        uint cId = allVotes[_vId].vCandidates.length;

        for(uint i = 0; i < _cNames.length; i++){
            // добавляем нового кандидата в список
            allVotes[_vId].vCandidates.push(Candidate(cId + i, 0, _cNames[i], _cAddresses[i]));
        }
    }

/* это аргументы для проверки
V_2
["ASD","ZXC","QWE"]
["0x583031D1113aD414F02576BD6afaBfb302140225","0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB","0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c"]

*/
    // ультра-функция добавления нового голосования сразу со списком кандидатов РАБОТАЕТ - РЕФАКТОР - 
    function addVotesAndListCandidate(
        string calldata _vName, 
        string[] calldata _cNames,
        address[] calldata _cAddresses
    )
        external
        onlyOwner
    {
        // добавляем голосование
        allVotes.push();
        // сохраняем индекс для удобства
        uint vIndex = allVotes.length - 1;
        // сохраняем в голосовании его название
        allVotes[vIndex].vName = _vName;
        // сохраняем id голосования
        allVotes[vIndex].vId = vIndex + 1;
        // получаем id кандидата
        uint cId = 0;
        for(uint i = 0; i < _cNames.length; i++){
            // добавляем нового кандидата в список
            allVotes[vIndex].vCandidates.push(Candidate(cId + i, 0, _cNames[i], _cAddresses[i]));
        }
    }

// *** ФУНКЦИИ ДОБАВЛЕНИЯ ГОЛОСОВАНИЯ И КАНДИДАДТОВ ***

// *** ФУНКЦИИ ИМЕНЕНИЯ ГОЛОСОВАНИЯ И КАНДИДАДТОВ ***

    // Функция изменения голосования - можно поменять имя
    function changeVote(
        uint _vId,
        string calldata _vName
    )
        external
        onlyOwner
        voitesDontStart(--_vId)
    {
        allVotes[_vId].vName = _vName;
    }

    // Функция изменения кандидадат - можно поменять имя и адрес
    // если меняете что-то одно, то всё равно надо передать два рагумента
    // но для экономии газа будут перезаписаны только обновляемые значения
    function changeCandidate(
        uint _vId,
        uint _cId,
        address _cAddress,
        string memory _cName
    )
        external
        onlyOwner
        voitesDontStart(--_vId)
    { 
        if(keccak256(bytes(allVotes[_vId].vCandidates[--_cId].cName)) != keccak256(bytes(_cName))){
            allVotes[_vId].vCandidates[_cId].cName = _cName;
        }
        if(allVotes[_vId].vCandidates[_cId].cAddress != _cAddress){
            allVotes[_vId].vCandidates[_cId].cAddress = _cAddress;
        }
    }

// *** ФУНКЦИИ ИМЕНЕНИЯ ГОЛОСОВАНИЯ И КАНДИДАДТОВ ***


// *** ФУНКЦИИ УДАЛЕНИЯ ГОЛОСОВАНИЯ И КАНДИДАДТОВ ***

    // функция удаления голосования
    // Исходим из идеи, что индекс и id начавшего голосования изменятся не должен
    // Поэтому данная функция может сработать, только если:
    // 1. это голосование ещё не началось
    // 2. это последнее голосование списке или последнее голосование в списке не начлось
    function delVotes(
        uint _vId
    )
        external
        onlyOwner
        voitesDontStart(--_vId)
    {
        require(allVotes[allVotes.length - 1].vStatusStart == false, "Ne VOZMOZHNO");

        if(_vId == allVotes.length - 1){
            // Если это последнее голосование в списке - просто удаляем его
            allVotes.pop();
        } else {
            // если не последнее, то перезаписываем имя
            allVotes[_vId].vName = allVotes[allVotes.length - 1].vName;
            // и список кандидатов из последнего
            allVotes[_vId].vCandidates = allVotes[allVotes.length - 1].vCandidates;
            // id даже и изменять не надо
            // последнее голосование из списка просто удаляем
            allVotes.pop();
        }
    }

    // функция удаления одного кандидата из списка
    function delCandidateFromVotes(
        uint _vId,
        uint _cId
    )
        external
        onlyOwner
        voitesDontStart(--_vId)
    {
        uint lastIndex = allVotes[_vId].vCandidates.length - 1;
        // на позицию удаляемого кандидадат записываем данные кандидата из конца списка
        allVotes[_vId].vCandidates[_cId - 1].cName = allVotes[_vId].vCandidates[lastIndex].cName;
        allVotes[_vId].vCandidates[_cId - 1].cAddress = allVotes[_vId].vCandidates[lastIndex].cAddress;
        // удаляем последнего кандидадата из списка
        allVotes[_vId].vCandidates.pop();
    }

// *** ФУНКЦИИ УДАЛЕНИЯ ГОЛОСОВАНИЯ И КАНДИДАДТОВ ***


// *** ФУНКЦИИ СТАРТА, ГОЛОСОВАНИЯ И ОКОНЧАНИЯ ***

    // Функция для старта голосования
    function startVote(
        uint _vId
    )
        external
        onlyOwner
    {
        // Начинаем голосование
        allVotes[--_vId].vStatusStart = true;
        // Сохраняем время начала голосования
        allVotes[_vId].vStartTime = block.timestamp;
    }

    // Функция голосования - РАБОТАЕТ _ РЕФАКТОР
    function vote(
        uint _vId,
        uint _cId
    )
        external
        payable
    {
        // проверка, что голосование ещё не закончилось - не прошло 3 дня с его старта
        require(block.timestamp < allVotes[_vId].vStartTime + 3 days, "");
        // проверка, что с этого адреса ещё не голосовали
        require(allVotes[_vId].vVoters[msg.sender] == false, "");
        // проверка, что голосующий внёс достаточно средства
        require(msg.value == 10000000000000000, "");
        // увеличиваем количество голосов за конкретного кандидадата
        allVotes[_vId].vCandidates[_cId].cVotes++;
        // увеличиваем общее количество голосв в данном голосовании
        allVotes[_vId].vTotal++;
        // отмечаем адрес как проголосовавший
        allVotes[_vId].vVoters[msg.sender] == true;
    }

    // функция окончания голосования
    function endVote(
        uint _vId
    )
        external
    {
        // проверка, что голосование закончилось - прошло 3 дня с его старта
        require(block.timestamp > allVotes[_vId].vStartTime + 3 days, "");
        // проверка, что голосование не было завершено ранее
        require(allVotes[_vId].vStatusEnd == false, "");

        // выставляем статус, что голосование завершено
        allVotes[_vId].vStatusEnd = true;

        // максимальное количество голосов за кандидата
        uint maxVote = 0;
        // количество победителей
        uint winnersCount = 0;
        
        // узнаём сколько голосов набрали победители и сколько у нас победителей
        for(uint i = 0; i < allVotes[_vId].vCandidates.length; i++){
            if(allVotes[_vId].vCandidates[i].cVotes > maxVote){
                maxVote = allVotes[_vId].vCandidates[i].cVotes;
                winnersCount = 1;
            }
            else if(allVotes[_vId].vCandidates[i].cVotes == maxVote){
                winnersCount += 1;
            }
        }
        // находим какую сумму выигрыл каждый победитель
        allVotes[_vId].vWinningAmount = 9000000000000000 * allVotes[_vId].vTotal / winnersCount;
        // кидаем деньги на счёт каждому победителю
        for(uint i = 0; i < allVotes[_vId].vCandidates.length; i++){
            if(allVotes[_vId].vCandidates[i].cVotes == maxVote){
                // Отправить средства на адрес победившего кандидата
                payable(allVotes[_vId].vCandidates[i].cAddress).transfer(allVotes[_vId].vWinningAmount);
                // добавляем адрес победителя в список победителей 
                allVotes[_vId].vIdWinners.push(allVotes[_vId].vCandidates[i].cId);
                winnersCount--;
            }
            if(winnersCount == 0){
                break;
            }
        }
    }

// *** ФУНКЦИИ СТАРТА, ГОЛОСОВАНИЯ И ОКОНЧАНИЯ ***


// *** ФУНКЦИИ ПОЛУЧЕНИЯ ИНФОРМАЦИИ О ГОЛОСОВАНИЯХ И КАНДИДАДАТХ ***

    // функция для получения списка вообще всех голосований - РАБОТАЕТ РЕФАКТОР
    function getallVotes()external view returns(VoteInfo[] memory){
        return getVoites(false, false, true);
    }
    // функция для получения списка всех текущих голосований - ТУТ что-то ломается
    function getCurrentVoites()external view returns(VoteInfo[] memory){
        return getVoites(true, false, false);
    }
    // функция для получения списка всех законченных голосований - ТУТ что-то ломается
    function getEndVoites()external view returns(VoteInfo[] memory){
        return getVoites(true, true, false);
    }

    // функция для получения списка всех голосований
    function getVoites(
        bool _start,
        bool _end,
        bool _all
    )
        private
        view
        returns(VoteInfo[] memory)
    {
        VoteInfo[] memory votes = new VoteInfo[](allVotes.length);

        for (uint i = 0; i < allVotes.length; i++){
            if(_all || allVotes[i].vStatusStart == _start && allVotes[i].vStatusEnd != _end){
                votes[i].vId = allVotes[i].vId;
                votes[i].vStartTime = allVotes[i].vStartTime;
                votes[i].vTotal = allVotes[i].vTotal;
                votes[i].vCandidateCount = allVotes[i].vCandidates.length;
                votes[i].vWinnersCount = allVotes[i].vIdWinners.length;
                votes[i].vWinningAmount = allVotes[i].vWinningAmount;
                votes[i].vName = allVotes[i].vName;
                votes[i].vStatusStart = allVotes[i].vStatusStart;
                votes[i].vStatusEnd = allVotes[i].vStatusEnd;
                votes[i].vCandidates = allVotes[i].vCandidates;
                votes[i].vIdWinners = allVotes[i].vIdWinners;
            }
        }
        return votes;
    }

    function getVotesByIDd(
        uint _vId
    )
        external
        view
        returns(VoteInfo memory)
    {
        VoteInfo  memory oneVote;
        oneVote.vId = allVotes[--_vId].vId;
        oneVote.vStartTime = allVotes[_vId].vStartTime;
        oneVote.vTotal = allVotes[_vId].vTotal;
        oneVote.vCandidateCount = allVotes[_vId].vCandidates.length;
        oneVote.vWinnersCount = allVotes[_vId].vIdWinners.length;
        oneVote.vWinningAmount = allVotes[_vId].vWinningAmount;
        oneVote.vName = allVotes[_vId].vName;
        oneVote.vStatusStart = allVotes[_vId].vStatusStart;
        oneVote.vStatusEnd = allVotes[_vId].vStatusEnd;
        oneVote.vCandidates = allVotes[_vId].vCandidates;
        oneVote.vIdWinners = allVotes[_vId].vIdWinners;
        return oneVote;
    }

    // функция для получения списка кандидатов из голосования - РАБОТАЕТ РЕФАКТОР
    function getCandidateByVoites(
        uint _vId
    )
        public
        view
        returns(Candidate[] memory)
    {
        Candidate[] memory candidateArray = new Candidate[](allVotes[--_vId].vCandidates.length);

        for(uint i = 0; i < candidateArray.length; i++){
            candidateArray[i].cId = allVotes[_vId].vCandidates[i].cId;
            candidateArray[i].cVotes = allVotes[_vId].vCandidates[i].cVotes;
            candidateArray[i].cName = allVotes[_vId].vCandidates[i].cName;
            candidateArray[i].cAddress = allVotes[_vId].vCandidates[i].cAddress;
        }
        return candidateArray;
    }

    // функция для получения списка победителей из голосования
    function getWinnersByVoites(
        uint _vId
    )
        public
        view
        returns(Candidate[] memory)
    {
        // проверяем, что голосование завершено
        require(allVotes[--_vId].vStatusEnd == true);
        Candidate[] memory winnersArray = new Candidate[](allVotes[_vId].vIdWinners.length);

        for(uint i = 0; i < winnersArray.length; i++){
            winnersArray[i].cId = allVotes[_vId].vCandidates[allVotes[_vId].vIdWinners[i]].cId;
            winnersArray[i].cVotes = allVotes[_vId].vCandidates[allVotes[_vId].vIdWinners[i]].cVotes;
            winnersArray[i].cName = allVotes[_vId].vCandidates[allVotes[_vId].vIdWinners[i]].cName;
            winnersArray[i].cAddress = allVotes[_vId].vCandidates[allVotes[_vId].vIdWinners[i]].cAddress;
        }
        return winnersArray;
    }

// *** ФУНКЦИИ ПОЛУЧЕНИЯ ИНФОРМАЦИИ О ГОЛОСОВАНИЯХ И КАНДИДАДАТХ ***


    // вывод средст владельцем контратка
    function withDraw()
        external
        onlyOwner
    {
        payable(owner).transfer(address(this).balance);
    }

}