const { Mitum } = require('@mitumjs/mitumjs')

const mitum = new Mitum(process.env.MITUM_TESTNET);
const test_currencyID = process.env.CURRENCY_ID;
const accounts = {}; // 메모리에 temporary account, aa account저장 
const serviceAcc = mitum.account.fromPrivateKey(process.env.SERVICE_PRIVATEKEY);

mitum.utils.setDecimal(9);
const amount = (amount) => {
    return mitum.utils.parseUnits(amount.toString());
}

exports.createAccount = async (req, res) => {
    const tempAcc = mitum.account.key();
    const keysArray = [{key: tempAcc.publickey, weight: 50}, {key: serviceAcc.publickey, weight: 50}];
    const aaAddress = mitum.account.addressForMultiSig(keysArray, 50);
    const operation = mitum.account.createMultiSig(serviceAcc.address, keysArray, test_currencyID, amount(100), 50);
    operation.sign(serviceAcc.privatekey);
    console.log(operation)

    try {
        const info = await mitum.operation.send(operation);
        const result = await info.wait(40000);
        console.log(result)

        if (result.status === 200) {
            if (result.data.in_state === false) {
                throw new Error(`in_state false, ${result.data.reason}`);
            }
        }

        accounts["temp_acc"] = tempAcc;
        accounts["aa_address"] = aaAddress;

        res.json({ status: 'success', temp_acc: tempAcc, aa_address: aaAddress  });
    } catch (error) {
        console.error('Fail to create new AA account:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
};


exports.getAccount = async (req, res) => {
    try {
        console.log(accounts.aa_address);
        const result = await mitum.account.balance(accounts.aa_address);
        console.log(result)
        if (result.status !== 200) {
            throw new Error(result);
        }

        res.json({ status: 'success', result: result });
    } catch (error) {
        console.error('Fail to get AA account:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.transfer = async (req, res) => {
    const expired_time = req.body.exp;
    const current_time = Math.floor(Date.now() / 1000);

    try {
        if (current_time >= expired_time) {
            accounts.temp_acc = null;
            throw new Error("Authentication has expired");
        } else if (!accounts.temp_acc) {
            throw new Error("temp_acc is null")
        }

        const op = mitum.currency.transfer(accounts.aa_address, process.env.SERVICE_ADDRESS, test_currencyID, amount(10));
        op.sign(accounts.temp_acc.privatekey);

        const info = await mitum.operation.send(op);
        const result = await info.wait(40000);
        console.log(result)

        if (result.status === 200) {
            if (result.data.in_state === false) {
                throw new Error(`in_state false, ${result.data.reason}`);
            }
        }

        res.json({ status: 'success', operation: op.toHintedObject() });
    } catch (error) {
        console.error('Fail to transfer with AA account:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
};


exports.updatekey = async (req, res) => {
    console.log("try to update key")
    const tempAcc = mitum.account.key();
    const keysArray = [{key: tempAcc.publickey, weight: 50}, {key: serviceAcc.publickey, weight: 50}];
    try {
        const op = mitum.account.updateKey(accounts.aa_address, keysArray, test_currencyID, 50);
        op.sign(serviceAcc.privatekey);

        const info = await mitum.operation.send(op);
        const result = await info.wait(40000);
        console.log(result)

        if (result.status === 200) {
            if (result.data.in_state === false) {
                throw new Error(`in_state false, ${result.data.reason}`);
            }
        }

        accounts["temp_acc"] = tempAcc;
        res.json({ status: 'success', temp_acc: tempAcc});
    } catch (error) {
        console.error('Fail to updatekey of AA account:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
};
