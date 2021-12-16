const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () =>{
    accounts = await web3.eth.getAccounts();

    lottery = await  new web3.eth.Contract(JSON.parse(interface))
        .deploy({
            data: bytecode,

        })
        .send({ from: accounts[0], gas: 1000000 });
})

describe('Lottery', () => {
    it('deploys', () => {
        assert.ok(lottery.options.address)
    });

    it('Allows multiple accounts to buy a ticket', async () =>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(players.length, 3);
        assert.equal(players[0], accounts[0]);
        assert.equal(players[1], accounts[1]);
        assert.equal(players[2], accounts[2]);
    });

    it('Doesn\'t allow to buy ticket if not enough money sent', async () =>{
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: web3.utils.toWei('0.002', 'ether')
            });
            assert(false)
        } catch (e) {
            assert(e)
        }
    });

    it('Not manager cannot pick winner', async () =>{
        try {
            await lottery.methods.enter().pickWinner({
                from: accounts[1],
                value: 0
            });
            assert(false)
        } catch (e) {
            assert(e)
        }
    });

    it('Manager can pick winner', async () =>{
        try {
            await lottery.methods.enter().pickWinner({
                from: accounts[0],
                value: 0
            });
            assert(true)
        } catch (e) {
            false
        }
    });

    it('Pick winner resets players', async () =>{

        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.pickWinner().send({
            from: accounts[0],
            value: 0
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0],
        });

        assert.equal(players.length, 0)



    });
})
