// CONFIG
import { FAUCET_ENABLED } from '../../../config/app.config';

import { Button } from 'antd';
import React, { FC, useContext, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { utils } from 'ethers';
import { parseEther } from '@ethersproject/units';

// import { EthComponentsSettingsContext } from '../../eth/models';
import { transactor } from '@drmg/shared/ui'; // function
import { EthComponentsSettingsContext } from '@drmg/shared/ui';
import { useBalance, useEthersContext, IEthersContext } from '@drmg/shared/ui';

import { IScaffoldAppProviders } from '../main/hooks/useScaffoldAppProviders';

/**
 * Is Faucet available?
 * @param scaffoldAppProviders
 * @param ethersContext
 * @returns
 */
export const getFaucetAvailable = (
  scaffoldAppProviders: IScaffoldAppProviders,
  ethersContext: IEthersContext
): boolean => {
  const result =
    (ethersContext?.provider &&
      ethersContext?.chainId != null &&
      ethersContext?.chainId === scaffoldAppProviders.targetNetwork.chainId &&
      scaffoldAppProviders.targetNetwork.name === 'localhost') ??
    false;
  return result && FAUCET_ENABLED;
};

interface IFaucetButton {
  scaffoldAppProviders: IScaffoldAppProviders;
  gasPrice: number | undefined;
}

export const FaucetHintButton: FC<IFaucetButton> = (props) => {
  const settingsContext = useContext(EthComponentsSettingsContext);
  const ethersContext = useEthersContext();

  const [yourLocalBalance] = useBalance(ethersContext.account ?? '');
  const signer = props.scaffoldAppProviders.localAdaptor?.signer;
  /**
   * create transactor for faucet
   */
  const faucetTx = transactor(
    settingsContext,
    signer,
    undefined,
    undefined,
    true
  );

  /**
   * facuet is only available on localhost
   */
  const isAvailable = getFaucetAvailable(
    props.scaffoldAppProviders,
    ethersContext
  );
  const [faucetAvailable] = useDebounce(isAvailable, 500, {
    trailing: true,
  });
  const [faucetClicked, setFaucetClicked] = useState(false);

  const faucetHint = useMemo(() => {
    const min = parseFloat(
      utils.formatUnits(yourLocalBalance?.toBigInt() ?? 0, 'ether')
    );
    const lowFunds = yourLocalBalance && min < 0.002;
    const allowFaucet = faucetAvailable && !faucetClicked && lowFunds;

    if (allowFaucet && ethersContext?.account != null) {
      return (
        <div style={{ paddingTop: 10, paddingLeft: 10 }}>
          <Button
            type="primary"
            onClick={(): void => {
              if (faucetTx && ethersContext?.account != null) {
                faucetTx({
                  to: ethersContext?.account,
                  value: parseEther('0.01').toHexString(),
                })
                  .then(() => setFaucetClicked(true))
                  .catch(() => setFaucetClicked(false));
              }
            }}
          >
            💰 Grab funds from the faucet ⛽️
          </Button>
        </div>
      );
    } else {
      return <></>;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yourLocalBalance, faucetAvailable, ethersContext?.account, faucetTx]);

  return <> {faucetHint} </>;
};
