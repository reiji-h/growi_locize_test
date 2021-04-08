import {
  Required,
} from '@tsed/schema';
import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';

import { Installation as SlackInstallation } from '@slack/oauth';
import { Order } from './order';
import { Relation } from './relation';

@Entity()
export class Installation {

  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column({ type: 'json' })
  @Required()
  data: SlackInstallation;

  @CreateDateColumn()
  readonly createdAt: Date;

  @UpdateDateColumn()
  readonly updatedAt: Date;

  @Column({ nullable: true })
  isEnterpriseInstall?: boolean;

  @Column({ nullable: true, unique: true })
  teamId?: string;

  @Column({ nullable: true, unique: true })
  enterpriseId?: string;

  @OneToMany(() => Order, order => order.installation)
  orders?: Order[];

  @OneToMany(() => Relation, relation => relation.installation)
  relations?: Relation[];

  setData(slackInstallation: SlackInstallation): void {
    this.data = slackInstallation;

    this.isEnterpriseInstall = slackInstallation.isEnterpriseInstall;
    this.teamId = slackInstallation.team?.id;
    this.enterpriseId = slackInstallation.enterprise?.id;
  }

}
