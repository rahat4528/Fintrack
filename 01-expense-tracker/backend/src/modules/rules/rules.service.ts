import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RuleOperator, RuleActionType, TransactionRule } from '@prisma/client';
import { DecimalUtil } from '../../common/decimal.util';

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.transactionRule.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    });
  }

  async create(
    userId: string,
    data: {
      name: string;
      priority?: number;
      field: string;
      operator: RuleOperator;
      matchValue: string;
      actionType: RuleActionType;
      actionValue: string;
    },
  ) {
    return this.prisma.transactionRule.create({
      data: {
        userId,
        name: data.name,
        priority: data.priority || 0,
        field: data.field,
        operator: data.operator,
        matchValue: data.matchValue,
        actionType: data.actionType,
        actionValue: data.actionValue,
      },
    });
  }

  async delete(userId: string, id: string) {
    const rule = await this.prisma.transactionRule.findFirst({
      where: { id, userId },
    });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
    return this.prisma.transactionRule.delete({ where: { id } });
  }

  evaluateRule(rule: TransactionRule, tx: { description: string; amount?: string | number }): boolean {
    let fieldValue = '';
    if (rule.field === 'description') {
      fieldValue = tx.description || '';
    } else if (rule.field === 'amount') {
      fieldValue = tx.amount ? String(tx.amount) : '';
    }

    const matchVal = rule.matchValue.toLowerCase();
    const sourceVal = fieldValue.toLowerCase();

    switch (rule.operator) {
      case RuleOperator.CONTAINS:
        return sourceVal.includes(matchVal);
      case RuleOperator.EQUALS:
        return sourceVal === matchVal;
      case RuleOperator.STARTS_WITH:
        return sourceVal.startsWith(matchVal);
      case RuleOperator.GREATER_THAN:
        return DecimalUtil.toDecimal(sourceVal).greaterThan(DecimalUtil.toDecimal(matchVal));
      case RuleOperator.LESS_THAN:
        return DecimalUtil.toDecimal(sourceVal).lessThan(DecimalUtil.toDecimal(matchVal));
      default:
        return false;
    }
  }

  async applyRules(
    userId: string,
    tx: { description: string; amount?: string; categoryId?: string; tagIds?: string[] },
  ) {
    const rules = await this.findAll(userId);
    const appliedActions: Array<{ ruleName: string; action: string; value: string }> = [];

    const modified = { ...tx, tagIds: [...(tx.tagIds || [])] };

    for (const rule of rules) {
      if (this.evaluateRule(rule, modified)) {
        if (rule.actionType === RuleActionType.SET_CATEGORY) {
          modified.categoryId = rule.actionValue;
          appliedActions.push({ ruleName: rule.name, action: 'SET_CATEGORY', value: rule.actionValue });
        } else if (rule.actionType === RuleActionType.ADD_TAG) {
          if (!modified.tagIds.includes(rule.actionValue)) {
            modified.tagIds.push(rule.actionValue);
            appliedActions.push({ ruleName: rule.name, action: 'ADD_TAG', value: rule.actionValue });
          }
        } else if (rule.actionType === RuleActionType.SET_DESCRIPTION) {
          modified.description = rule.actionValue;
          appliedActions.push({ ruleName: rule.name, action: 'SET_DESCRIPTION', value: rule.actionValue });
        }
      }
    }

    return {
      modifiedTransaction: modified,
      appliedActions,
    };
  }
}
