// добавление кандидатов в голосование списком
task("addListCandidatesToVote", "Add candidates to vote")
  .addParam("vId", "Vote Id")
  .addParam("cNames", "Candidate names")
  .addParam("cAddresses", "Candidate addresses")
  .setAction(async (taskArgs) => {
    // подключаемся к контракту
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.attach("0x2213faC85F8888f9Cd107dc0c239fA130d9e58f3");
    
    // вызываем функцию на контракте
    const tx = await voting.addListCandidatesToVote(
      _vId = taskArgs.vId, _cNames = taskArgs.cNames, _cAddresses = taskArgs.cAddresses);
    await tx.wait();
  
    // получаем информацию о голосовании
    const response  = await voting.getVoteByID(_vId = taskArgs.vId);
    // достаём информацию о голосовании
    const vote = getVote(response);
    // выводим информацию о голосовании
    console.log("Candidates successfully added to the vote")
    console.log(vote);
});


// добавление голосования со списком кандидатов
task("addVoteAndListCandidates", "Create new vote and add candidates to vote")
  .addParam("vName", "Vote name")
  .addParam("cNames", "Candidate names")
  .addParam("cAddresses", "Candidate addressts")
  .setAction(async (taskArgs) => {
    // подключаемся к контракту
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.attach("0x2213faC85F8888f9Cd107dc0c239fA130d9e58f3");

    // вызываем функцию на контракте
    const tx = await voting.addVoteAndListCandidates(
      _vName = taskArgs.vName, _cNames = taskArgs.cNames, _cAddresses = taskArgs.cAddresses);
    await tx.wait();

    // получаем информацию о всех голосования
    const response  = await voting.getallVotes();
    // достаём информацию о последнем голосовании
    const vote = getVote(response[response.length - 1]);
    // выводим информацию о голосовании
    console.log("Voting has been successfully established")
    console.log(vote);
});