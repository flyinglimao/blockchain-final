const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Protocol', function () {
  it('Should work', async function () {
    const [signer] = await ethers.getSigners();
    const protocol = await ethers.getContractAt('Protocol', '0x0E2aE0C67f0AA03B73160bc2D9f40E23D7E1D7F5');
    const MonkeyStrategy = await hre.ethers.getContractFactory('MonkeyStrategy');
    console.log('?1')
    const monkeyStrategy = await MonkeyStrategy.deploy();

    await monkeyStrategy.deployed();
    console.log('?2')

    console.log(monkeyStrategy.address)
    await protocol.approve(monkeyStrategy.address, 100000000);
    console.log('?3')

    const WETH = new ethers.Contract(
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      ['function deposit() public payable'],
      signer
    );
    await WETH.deposit({ value: ethers.utils.parseEther('10') });

    const WETH2 = await ethers.getContractAt(
      'IERC20',
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      signer
    );
    await WETH2.approve(monkeyStrategy.address, ethers.utils.parseEther('10'));
    await protocol.deposit(2, ethers.utils.parseEther('0.0001'));
    console.log('?4')
    await protocol.deposit(2, ethers.utils.parseEther('0.0002'));
    console.log('?5')

    await protocol.run(2);
    await protocol.run(2);
    console.log('?6')
    await protocol.deposit(2, ethers.utils.parseEther('0.0002'));
    console.log('?7')
    await protocol.withdraw(2, ethers.utils.parseEther('0.0005'));
    await protocol.deposit(2, ethers.utils.parseEther('0.0002'));
    await protocol.withdraw(2, ethers.utils.parseEther('0.0001'));
  });
});
